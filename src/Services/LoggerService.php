<?php

namespace App\Services;

use App\Config\Database;
use PDO;

/**
 * Serviço centralizado de logging para operações de importação.
 * 
 * Registra eventos simultaneamente em duas camadas:
 * 1. Tabela `import_logs` no banco (para consulta via API/interface)
 * 2. Arquivo `.log` em `data/logs/` (para análise offline)
 * 
 * Cada registro inclui: nível (INFO/WARNING/ERROR), fase da operação,
 * mensagem descritiva, contexto JSON opcional e número da linha da planilha.
 */
class LoggerService {

    /** @var PDO Conexão com o banco de dados */
    private $db;

    /** @var string Caminho base para os arquivos de log */
    private $logBasePath;

    public function __construct() {
        $this->db = Database::getConnection();
        $this->logBasePath = __DIR__ . '/../../data/logs';

        // Garante que o diretório de logs existe
        if (!is_dir($this->logBasePath)) {
            mkdir($this->logBasePath, 0755, true);
        }
    }

    /**
     * Registra um evento de log no banco e em arquivo.
     * 
     * @param string $batchId  Identificador do lote de importação.
     * @param string $level    Nível do log: 'INFO', 'WARNING' ou 'ERROR'.
     * @param string $phase    Fase da operação: 'validation', 'snapshot', 'import', 'rollback', 'restore'.
     * @param string $message  Descrição legível do evento.
     * @param array|null $context  Dados extras em formato associativo (será salvo como JSON).
     * @param int|null $rowNumber  Número da linha da planilha (se aplicável).
     */
    public function log(string $batchId, string $level, string $phase, string $message, ?array $context = null, ?int $rowNumber = null): void {
        // 1. Persistir no banco de dados
        $this->logToDatabase($batchId, $level, $phase, $message, $context, $rowNumber);

        // 2. Persistir em arquivo
        $this->logToFile($batchId, $level, $phase, $message, $context, $rowNumber);
    }

    /**
     * Atalho para registrar evento de nível INFO.
     */
    public function info(string $batchId, string $phase, string $message, ?array $context = null, ?int $rowNumber = null): void {
        $this->log($batchId, 'INFO', $phase, $message, $context, $rowNumber);
    }

    /**
     * Atalho para registrar evento de nível WARNING.
     */
    public function warning(string $batchId, string $phase, string $message, ?array $context = null, ?int $rowNumber = null): void {
        $this->log($batchId, 'WARNING', $phase, $message, $context, $rowNumber);
    }

    /**
     * Atalho para registrar evento de nível ERROR.
     */
    public function error(string $batchId, string $phase, string $message, ?array $context = null, ?int $rowNumber = null): void {
        $this->log($batchId, 'ERROR', $phase, $message, $context, $rowNumber);
    }

    /**
     * Consulta logs filtrados por batch e opcionalmente por nível.
     * 
     * @param string $batchId  Identificador do lote.
     * @param string|null $level  Filtro opcional por nível (INFO, WARNING, ERROR).
     * @return array Lista de registros de log ordenados cronologicamente.
     */
    public function getLogsByBatch(string $batchId, ?string $level = null): array {
        $sql = "SELECT id, batch_id, log_level, phase, message, context_json, row_number, created_at 
                FROM import_logs 
                WHERE batch_id = ?";
        $params = [$batchId];

        if ($level !== null) {
            $sql .= " AND log_level = ?";
            $params[] = $level;
        }

        $sql .= " ORDER BY created_at ASC, id ASC";

        $stmt = $this->db->prepare($sql);
        $stmt->execute($params);
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    /**
     * Retorna contagens de logs agrupadas por nível para um batch.
     * 
     * @param string $batchId  Identificador do lote.
     * @return array Mapa de contagens: ['info' => N, 'warning' => N, 'error' => N]
     */
    public function getSummary(string $batchId): array {
        $stmt = $this->db->prepare("
            SELECT log_level, COUNT(*) as count 
            FROM import_logs 
            WHERE batch_id = ? 
            GROUP BY log_level
        ");
        $stmt->execute([$batchId]);
        $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);

        $summary = ['info' => 0, 'warning' => 0, 'error' => 0];
        foreach ($rows as $row) {
            $key = strtolower($row['log_level']);
            $summary[$key] = (int)$row['count'];
        }

        return $summary;
    }

    /**
     * Exporta os logs de um batch para um arquivo .log em disco.
     * Útil para análise offline ou backup antes de limpeza.
     * 
     * @param string $batchId  Identificador do lote.
     * @return string Caminho absoluto do arquivo de log gerado.
     */
    public function exportToFile(string $batchId): string {
        $logs = $this->getLogsByBatch($batchId);
        $filePath = $this->logBasePath . '/' . $batchId . '_export.log';

        $lines = [];
        foreach ($logs as $log) {
            $contextStr = $log['context_json'] ? ' | ' . $log['context_json'] : '';
            $rowStr = $log['row_number'] !== null ? " [row:{$log['row_number']}]" : '';
            $lines[] = "[{$log['created_at']}] [{$log['log_level']}] [{$log['phase']}]{$rowStr} {$log['message']}{$contextStr}";
        }

        file_put_contents($filePath, implode("\n", $lines) . "\n");
        return $filePath;
    }

    /**
     * Insere registro de log na tabela import_logs.
     * Falhas silenciosas para não interromper o fluxo de importação.
     */
    private function logToDatabase(string $batchId, string $level, string $phase, string $message, ?array $context, ?int $rowNumber): void {
        try {
            $stmt = $this->db->prepare("
                INSERT INTO import_logs (batch_id, log_level, phase, message, context_json, row_number) 
                VALUES (?, ?, ?, ?, ?, ?)
            ");
            $stmt->execute([
                $batchId,
                $level,
                $phase,
                $message,
                $context ? json_encode($context, JSON_UNESCAPED_UNICODE) : null,
                $rowNumber
            ]);
        } catch (\Exception $e) {
            // Log de banco falhou — registra apenas em arquivo para não perder o evento
            error_log("[LoggerService] Falha ao gravar log no banco: " . $e->getMessage());
        }
    }

    /**
     * Anexa registro de log ao arquivo .log correspondente ao batch.
     * Formato: [TIMESTAMP] [LEVEL] [PHASE] [row:N] message | context_json
     */
    private function logToFile(string $batchId, string $level, string $phase, string $message, ?array $context, ?int $rowNumber): void {
        try {
            $filePath = $this->logBasePath . '/' . $batchId . '.log';
            $timestamp = date('Y-m-d H:i:s');
            $contextStr = $context ? ' | ' . json_encode($context, JSON_UNESCAPED_UNICODE) : '';
            $rowStr = $rowNumber !== null ? " [row:{$rowNumber}]" : '';

            $line = "[{$timestamp}] [{$level}] [{$phase}]{$rowStr} {$message}{$contextStr}\n";
            file_put_contents($filePath, $line, FILE_APPEND | LOCK_EX);
        } catch (\Exception $e) {
            error_log("[LoggerService] Falha ao gravar log em arquivo: " . $e->getMessage());
        }
    }
}
