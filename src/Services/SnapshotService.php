<?php

namespace App\Services;

use App\Config\Database;
use PDO;

/**
 * Serviço responsável por criar e restaurar snapshots (dumps SQL) do banco de dados.
 * 
 * Utiliza `mysqldump` para gerar dumps completos das tabelas de dados antes de cada
 * importação, permitindo restauração total em caso de corrupção ou erro.
 * 
 * Tabelas incluídas no snapshot: sectors, responsibles, responsible_sectors, processes, movements.
 * Tabelas excluídas: users (preservadas durante restore), import_versions, import_logs (metadados).
 */
class SnapshotService {

    /** @var PDO Conexão com o banco de dados */
    private $db;

    /** @var LoggerService Serviço de logging */
    private $logger;

    /** @var string Caminho base para os snapshots */
    private $snapshotBasePath;

    /** @var array Tabelas incluídas no snapshot (ordem respeitando FK) */
    private const DATA_TABLES = [
        'sectors',
        'responsibles',
        'responsible_sectors',
        'processes',
        'movements'
    ];

    public function __construct(LoggerService $logger) {
        $this->db = Database::getConnection();
        $this->logger = $logger;
        $this->snapshotBasePath = __DIR__ . '/../../data/snapshots';

        // Garante que o diretório de snapshots existe
        if (!is_dir($this->snapshotBasePath)) {
            mkdir($this->snapshotBasePath, 0755, true);
        }
    }

    /**
     * Cria um snapshot (dump SQL) das tabelas de dados antes da importação.
     * 
     * O dump é gerado via `mysqldump` e inclui instruções DROP TABLE + CREATE TABLE + INSERT.
     * O arquivo resultante pode ser usado para restauração completa.
     * 
     * @param string $batchId  Identificador do lote de importação associado.
     * @return string Caminho absoluto do arquivo de snapshot gerado.
     * @throws \RuntimeException Se o mysqldump falhar.
     */
    public function createSnapshot(string $batchId): string {
        $timestamp = date('Ymd_His');
        $filename = "snap_{$timestamp}_{$batchId}.sql";
        $filePath = $this->snapshotBasePath . '/' . $filename;

        $this->logger->info($batchId, 'snapshot', "Iniciando criação de snapshot: {$filename}");

        // Obtém credenciais do banco a partir das variáveis de ambiente
        $dbHost = getenv('DB_HOST') ?: 'db';
        $dbUser = getenv('DB_USER') ?: 'root';
        $dbPass = getenv('DB_PASS') ?: '';
        $dbName = getenv('DB_NAME') ?: 'subfisproc';

        $tables = implode(' ', self::DATA_TABLES);

        // Monta comando mysqldump com opções seguras
        // --single-transaction: snapshot consistente sem lock em tabelas InnoDB
        // --routines=false: não inclui stored procedures
        // --triggers=false: não inclui triggers
        $cmd = sprintf(
            'mysqldump --skip-ssl --host=%s --user=%s --password=%s --single-transaction --no-tablespaces --routines=false --triggers=false %s %s > %s 2>&1',
            escapeshellarg($dbHost),
            escapeshellarg($dbUser),
            escapeshellarg($dbPass),
            escapeshellarg($dbName),
            $tables,
            escapeshellarg($filePath)
        );

        exec($cmd, $output, $returnCode);

        if ($returnCode !== 0) {
            $errorMsg = implode("\n", $output);
            $this->logger->error($batchId, 'snapshot', "Falha no mysqldump (code: {$returnCode}): {$errorMsg}");
            throw new \RuntimeException("Falha ao criar snapshot: {$errorMsg}");
        }

        // Verifica que o arquivo foi criado e tem conteúdo
        if (!file_exists($filePath) || filesize($filePath) === 0) {
            $this->logger->error($batchId, 'snapshot', 'Arquivo de snapshot vazio ou inexistente');
            throw new \RuntimeException('Snapshot gerado está vazio ou não foi criado.');
        }

        $sizeBytes = filesize($filePath);
        $sizeMB = round($sizeBytes / 1024 / 1024, 2);

        $this->logger->info($batchId, 'snapshot', "Snapshot criado com sucesso: {$filename} ({$sizeMB}MB)", [
            'file' => $filePath,
            'size_bytes' => $sizeBytes,
            'tables' => self::DATA_TABLES
        ]);

        return $filePath;
    }

    /**
     * Restaura o banco de dados a partir de um snapshot SQL.
     * 
     * Processo:
     * 1. Desabilita verificação de chaves estrangeiras
     * 2. Trunca todas as tabelas de dados (na ordem inversa de FK)
     * 3. Importa o dump SQL
     * 4. Reabilita verificação de chaves estrangeiras
     * 
     * @param string $snapshotFile  Caminho absoluto do arquivo de snapshot.
     * @param string $batchId  Identificador do lote para logging.
     * @return bool True se restauração foi bem-sucedida.
     * @throws \RuntimeException Se o arquivo não existir ou a restauração falhar.
     */
    public function restoreSnapshot(string $snapshotFile, string $batchId): bool {
        if (!file_exists($snapshotFile)) {
            $this->logger->error($batchId, 'restore', "Arquivo de snapshot não encontrado: {$snapshotFile}");
            throw new \RuntimeException("Arquivo de snapshot não encontrado: {$snapshotFile}");
        }

        $this->logger->info($batchId, 'restore', "Iniciando restauração do snapshot: " . basename($snapshotFile));

        try {
            // Desabilita FK checks para permitir truncar tabelas com dependências
            $this->db->exec('SET FOREIGN_KEY_CHECKS = 0');

            // Trunca tabelas de dados na ordem inversa (dependências primeiro)
            $reverseTables = array_reverse(self::DATA_TABLES);
            foreach ($reverseTables as $table) {
                $this->db->exec("TRUNCATE TABLE `{$table}`");
                $this->logger->info($batchId, 'restore', "Tabela truncada: {$table}");
            }

            // Importa o dump via mysql CLI para suportar arquivos grandes
            $dbHost = getenv('DB_HOST') ?: 'db';
            $dbUser = getenv('DB_USER') ?: 'root';
            $dbPass = getenv('DB_PASS') ?: '';
            $dbName = getenv('DB_NAME') ?: 'subfisproc';

            $cmd = sprintf(
                'mysql --skip-ssl --host=%s --user=%s --password=%s %s < %s 2>&1',
                escapeshellarg($dbHost),
                escapeshellarg($dbUser),
                escapeshellarg($dbPass),
                escapeshellarg($dbName),
                escapeshellarg($snapshotFile)
            );

            exec($cmd, $output, $returnCode);

            if ($returnCode !== 0) {
                $errorMsg = implode("\n", $output);
                $this->logger->error($batchId, 'restore', "Falha na restauração (code: {$returnCode}): {$errorMsg}");
                throw new \RuntimeException("Falha ao restaurar snapshot: {$errorMsg}");
            }

            // Reabilita FK checks
            $this->db->exec('SET FOREIGN_KEY_CHECKS = 1');

            // Verifica integridade básica pós-restauração
            $counts = [];
            foreach (self::DATA_TABLES as $table) {
                $count = (int)$this->db->query("SELECT COUNT(*) FROM `{$table}`")->fetchColumn();
                $counts[$table] = $count;
            }

            $this->logger->info($batchId, 'restore', 'Restauração concluída com sucesso', [
                'source_file' => basename($snapshotFile),
                'row_counts' => $counts
            ]);

            return true;

        } catch (\Exception $e) {
            // Garante que FK checks seja reabilitado mesmo em caso de erro
            $this->db->exec('SET FOREIGN_KEY_CHECKS = 1');
            $this->logger->error($batchId, 'restore', 'Exceção durante restauração: ' . $e->getMessage());
            throw $e;
        }
    }

    /**
     * Lista todos os snapshots disponíveis com metadados.
     * 
     * @return array Lista de snapshots com nome, tamanho, data e batch_id.
     */
    public function listSnapshots(): array {
        $snapshots = [];
        $files = glob($this->snapshotBasePath . '/snap_*.sql');

        if ($files === false) return [];

        foreach ($files as $file) {
            $filename = basename($file);
            // Extrai batch_id do nome: snap_20260505_123456_imp_abc123.sql
            $batchId = null;
            if (preg_match('/^snap_\d{8}_\d{6}_(.+)\.sql$/', $filename, $matches)) {
                $batchId = $matches[1];
            }

            $snapshots[] = [
                'filename' => $filename,
                'filepath' => $file,
                'batch_id' => $batchId,
                'size_bytes' => filesize($file),
                'size_mb' => round(filesize($file) / 1024 / 1024, 2),
                'created_at' => date('Y-m-d H:i:s', filemtime($file))
            ];
        }

        // Ordena do mais recente para o mais antigo
        usort($snapshots, function ($a, $b) {
            return strcmp($b['created_at'], $a['created_at']);
        });

        return $snapshots;
    }

    /**
     * Remove snapshots antigos além do limite de retenção.
     * 
     * @param int $keepCount  Número de snapshots mais recentes a manter (padrão: 10).
     */
    public function rotateSnapshots(int $keepCount = 10): void {
        $snapshots = $this->listSnapshots();

        if (count($snapshots) <= $keepCount) return;

        // Remove os excedentes (os mais antigos)
        $toRemove = array_slice($snapshots, $keepCount);
        foreach ($toRemove as $snapshot) {
            if (file_exists($snapshot['filepath'])) {
                unlink($snapshot['filepath']);
            }
        }
    }

    /**
     * Resolve o caminho de um snapshot a partir do batch_id.
     * Busca no diretório de snapshots por arquivos que contenham o batch_id no nome.
     * 
     * @param string $batchId  Identificador do lote.
     * @return string|null Caminho absoluto do snapshot ou null se não encontrado.
     */
    public function getSnapshotPath(string $batchId): ?string {
        $files = glob($this->snapshotBasePath . "/snap_*_{$batchId}.sql");
        if ($files && count($files) > 0) {
            return $files[0];
        }
        return null;
    }
}
