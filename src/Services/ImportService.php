<?php

namespace App\Services;

use App\Config\Database;
use PDO;

/**
 * Serviço que encapsula toda a lógica de importação de dados.
 * 
 * Extraído e refatorado a partir do módulo legado `api/import.php`.
 * Toda operação é envolvida em transação e cada etapa é logada via LoggerService.
 * 
 * Responsabilidades:
 * - Validação prévia dos dados (sem alterar o banco)
 * - Importação transacional com criação automática de entidades
 * - Desfazer (undo) um lote específico
 * - Consulta de histórico enriquecido com logs
 */
class ImportService {

    /** @var PDO Conexão com o banco de dados */
    private $db;

    /** @var LoggerService Serviço de logging */
    private $logger;

    public function __construct(LoggerService $logger) {
        $this->db = Database::getConnection();
        $this->logger = $logger;
    }

    /**
     * Validação prévia dos dados sem alterar o banco de dados.
     * 
     * Verifica cada linha quanto a: campos obrigatórios, formatos de data,
     * nomes de setor inválidos, e retorna um relatório de erros/avisos.
     * 
     * @param array $rows  Array de linhas de dados da planilha.
     * @param string $batchId  Identificador do lote para logging.
     * @return array ['valid' => bool, 'errors' => [...], 'warnings' => [...], 'total_rows' => N]
     */
    public function validateData(array $rows, string $batchId): array {
        $errors = [];
        $warnings = [];

        $this->logger->info($batchId, 'validation', 'Iniciando validação de ' . count($rows) . ' linhas');

        foreach ($rows as $index => $row) {
            $lineNum = $index + 1;

            // Campo obrigatório: process_number
            $processNumber = trim($row['process_number'] ?? '');
            if (empty($processNumber)) {
                $errors[] = ['row' => $lineNum, 'field' => 'process_number', 'message' => 'Número do processo vazio'];
                $this->logger->error($batchId, 'validation', 'Número do processo vazio', ['row' => $lineNum], $lineNum);
                continue;
            }

            // Validação de data
            $movementDate = trim($row['movement_date'] ?? '');
            if (!empty($movementDate)) {
                if (!$this->isValidDate($movementDate)) {
                    $warnings[] = ['row' => $lineNum, 'field' => 'movement_date', 'message' => "Data inválida: '{$movementDate}' — será substituída pela data atual"];
                    $this->logger->warning($batchId, 'validation', "Data inválida será substituída", [
                        'row' => $lineNum,
                        'original' => $movementDate,
                        'replaced' => date('Y-m-d H:i:s')
                    ], $lineNum);
                }
            }

            // Validação de setor
            $sectorRaw = trim($row['destination_sector'] ?? '');
            if ($this->isInvalidSectorName($sectorRaw)) {
                $warnings[] = ['row' => $lineNum, 'field' => 'destination_sector', 'message' => "Setor inválido: '{$sectorRaw}' — será usado 'SUBFIS'"];
                $this->logger->warning($batchId, 'validation', "Setor inválido substituído por SUBFIS", [
                    'row' => $lineNum,
                    'raw_value' => $sectorRaw
                ], $lineNum);
            }
        }

        $isValid = count($errors) === 0;
        $this->logger->info($batchId, 'validation', "Validação concluída: {$lineNum} linhas, " . count($errors) . " erros, " . count($warnings) . " avisos");

        return [
            'valid' => $isValid,
            'errors' => $errors,
            'warnings' => $warnings,
            'total_rows' => count($rows)
        ];
    }

    /**
     * Executa a importação transacional dos dados.
     * 
     * Lógica extraída de `api/import.php` e refatorada com logging detalhado.
     * Cada entidade criada/atualizada é registrada no log.
     * 
     * @param array $rows  Array de linhas de dados da planilha.
     * @param string $batchId  Identificador do lote de importação.
     * @param int $userId  ID do usuário que executou a importação.
     * @return array ['success' => bool, 'stats' => [...], 'batch_id' => string]
     * @throws \Exception Se a importação falhar (transaction é revertida).
     */
    public function executeImport(array $rows, string $batchId, int $userId): array {
        $this->logger->info($batchId, 'import', "Iniciando importação de " . count($rows) . " linhas", [
            'user_id' => $userId,
            'batch_id' => $batchId
        ]);

        try {
            $this->db->beginTransaction();

            $stats = [
                'movements_created' => 0,
                'processes_created' => 0,
                'apensos_created' => 0,
                'responsibles_created' => 0,
                'sectors_created' => 0
            ];

            // Preload dos caches para lookup rápido
            $sectorsCache = $this->preloadCache('sectors', 'name');
            $responsiblesCache = $this->preloadCache('responsibles', 'name');
            $processesCache = $this->preloadCache('processes', 'process_number');

            // Cache de vínculos responsável-setor existentes
            $respSectorCache = [];
            $stmt = $this->db->query("SELECT responsible_id, sector_id FROM responsible_sectors");
            foreach ($stmt->fetchAll() as $rs) {
                $respSectorCache[$rs['responsible_id'] . '_' . $rs['sector_id']] = true;
            }

            // Hierarquia interna de setores
            $internalDescendants = $this->buildInternalHierarchy();

            foreach ($rows as $index => $row) {
                $lineNum = $index + 1;

                // Limpeza robusta dos campos
                $processNumber = trim(preg_replace('/\s+/', ' ', $row['process_number'] ?? ''));
                if (empty($processNumber)) {
                    $this->logger->warning($batchId, 'import', 'Linha ignorada: processo vazio', ['row' => $lineNum], $lineNum);
                    continue;
                }

                $movementDate = $this->parseDate(trim($row['movement_date'] ?? ''));
                if ($movementDate === null) {
                    $movementDate = date('Y-m-d H:i:s');
                    $this->logger->warning($batchId, 'import', 'Data inválida substituída pela data atual', [
                        'row' => $lineNum,
                        'original' => trim($row['movement_date'] ?? '')
                    ], $lineNum);
                }

                $movActionRaw = trim($row['action'] ?? 'ENTRADA');
                $movAction = preg_match('/SA[IÍ]/iu', $movActionRaw) ? 'SAIDA' : 'ENTRADA';

                $responsibleName = trim(preg_replace('/\s+/', ' ', $row['responsible'] ?? ''));
                $subject = trim($row['subject'] ?? 'Processo Importado');
                $sectorRaw = trim(preg_replace('/\s+/', ' ', $row['destination_sector'] ?? ''));
                $sectorName = $this->isInvalidSectorName($sectorRaw) ? 'SUBFIS' : $sectorRaw;

                // 1. Setor — criar se não existir
                $sKey = strtolower($sectorName);
                if (!isset($sectorsCache[$sKey])) {
                    $stmt = $this->db->prepare("INSERT INTO sectors (name, import_batch) VALUES (?, ?)");
                    $stmt->execute([$sectorName, $batchId]);
                    $sectorsCache[$sKey] = $this->db->lastInsertId();
                    $stats['sectors_created']++;
                    $this->logger->info($batchId, 'import', "Setor criado automaticamente: \"{$sectorName}\"", [
                        'sector_id' => $sectorsCache[$sKey],
                        'row' => $lineNum
                    ], $lineNum);
                }
                $currentSectorId = $sectorsCache[$sKey];

                // Override de ação baseado na hierarquia interna
                if (!in_array($currentSectorId, $internalDescendants)) {
                    $stmtInternal = $this->db->prepare("SELECT is_internal FROM sectors WHERE id = ?");
                    $stmtInternal->execute([$currentSectorId]);
                    $isInt = $stmtInternal->fetchColumn();
                    $movAction = $isInt ? 'ENTRADA' : 'SAIDA';
                } else {
                    $movAction = 'ENTRADA';
                }

                // 2. Responsável — lookup por nome, vincular ao setor via pivot
                $respId = null;
                if (!empty($responsibleName)) {
                    $rKey = strtolower($responsibleName);
                    if (!isset($responsiblesCache[$rKey])) {
                        $stmt = $this->db->prepare("INSERT INTO responsibles (name, sector_id, import_batch) VALUES (?, ?, ?)");
                        $stmt->execute([$responsibleName, $currentSectorId, $batchId]);
                        $respId = $this->db->lastInsertId();
                        $responsiblesCache[$rKey] = $respId;
                        $stats['responsibles_created']++;
                        $this->logger->info($batchId, 'import', "Responsável criado: \"{$responsibleName}\"", [
                            'responsible_id' => $respId,
                            'row' => $lineNum
                        ], $lineNum);
                    } else {
                        $respId = $responsiblesCache[$rKey];
                    }

                    // Vínculo responsável-setor via pivot table
                    $rsKey = $respId . '_' . $currentSectorId;
                    if (!isset($respSectorCache[$rsKey])) {
                        $stmt = $this->db->prepare("INSERT IGNORE INTO responsible_sectors (responsible_id, sector_id) VALUES (?, ?)");
                        $stmt->execute([$respId, $currentSectorId]);
                        $respSectorCache[$rsKey] = true;
                    }
                }

                // 3. Processo — criar se não existir
                $pKey = strtolower(trim($processNumber));
                if (!isset($processesCache[$pKey])) {
                    $stmt = $this->db->prepare("INSERT INTO processes (process_number, subject, requester, import_batch) 
                                                VALUES (?, ?, ?, ?) 
                                                ON DUPLICATE KEY UPDATE id=LAST_INSERT_ID(id)");
                    $stmt->execute([$processNumber, $subject, 'Importação de Dados', $batchId]);
                    $processesCache[$pKey] = $this->db->lastInsertId();
                    $stats['processes_created']++;
                }
                $currentProcessId = $processesCache[$pKey];

                // 3.1. Processos Apensos
                $attachedProcesses = $row['attached_processes'] ?? [];
                if (is_array($attachedProcesses)) {
                    foreach ($attachedProcesses as $attachedNum) {
                        $attachedNum = trim($attachedNum);
                        if (empty($attachedNum)) continue;

                        $apKey = strtolower($attachedNum);
                        if (!isset($processesCache[$apKey])) {
                            $stmt = $this->db->prepare("SELECT id FROM processes WHERE process_number = ?");
                            $stmt->execute([$attachedNum]);
                            $existing = $stmt->fetchColumn();

                            if ($existing) {
                                $processesCache[$apKey] = $existing;
                            } else {
                                $stmt = $this->db->prepare("INSERT INTO processes (process_number, parent_id, subject, requester, import_batch) 
                                                            VALUES (?, ?, ?, ?, ?) 
                                                            ON DUPLICATE KEY UPDATE id=LAST_INSERT_ID(id)");
                                $stmt->execute([$attachedNum, $currentProcessId, "Apensado ao {$processNumber}", 'Importação de Dados (Apenso)', $batchId]);
                                $processesCache[$apKey] = $this->db->lastInsertId();
                                $stats['apensos_created']++;
                                $this->logger->info($batchId, 'import', "Apenso criado: \"{$attachedNum}\" → \"{$processNumber}\"", [
                                    'row' => $lineNum
                                ], $lineNum);
                            }
                        }

                        // Garante o vínculo parent_id
                        if ($processesCache[$apKey] != $currentProcessId) {
                            $stmt = $this->db->prepare("UPDATE processes SET parent_id = ? WHERE id = ?");
                            $stmt->execute([$currentProcessId, $processesCache[$apKey]]);
                        }
                    }
                }

                // 4. Movimentação
                $stmt = $this->db->prepare("INSERT INTO movements (process_id, movement_date, action, destination_sector_id, responsible_id, user_id, import_batch) VALUES (?, ?, ?, ?, ?, ?, ?)");
                $stmt->execute([
                    $currentProcessId,
                    $movementDate,
                    $movAction,
                    $currentSectorId,
                    $respId,
                    $userId,
                    $batchId
                ]);
                $stats['movements_created']++;
            }

            $this->db->commit();

            $this->logger->info($batchId, 'import', "Importação concluída com sucesso", ['stats' => $stats]);
            $this->logger->info($batchId, 'import', sprintf(
                "Resumo: %d movimentos, %d processos, %d apensos, %d responsáveis, %d setores",
                $stats['movements_created'],
                $stats['processes_created'],
                $stats['apensos_created'],
                $stats['responsibles_created'],
                $stats['sectors_created']
            ));

            return [
                'success' => true,
                'batch_id' => $batchId,
                'stats' => $stats
            ];

        } catch (\Exception $e) {
            $this->db->rollBack();
            $this->logger->error($batchId, 'import', 'Importação falhou — rollback executado: ' . $e->getMessage(), [
                'exception' => get_class($e),
                'trace' => $e->getTraceAsString()
            ]);
            throw $e;
        }
    }

    /**
     * Desfaz uma importação específica, removendo todos os registros associados ao batch.
     * 
     * Ordem de remoção respeita as FK: movements → processes → (setores e responsáveis preservados).
     * 
     * @param string $batchId  Identificador do lote a desfazer.
     * @return array ['success' => bool, 'removed' => [...contagens...]]
     */
    public function undoBatch(string $batchId): array {
        $this->logger->info($batchId, 'rollback', "Iniciando undo do lote: {$batchId}");

        try {
            $this->db->beginTransaction();

            // Conta registros antes de remover
            $movCount = (int)$this->db->prepare("SELECT COUNT(*) FROM movements WHERE import_batch = ?");
            $movCount->execute([$batchId]);
            $movCount = (int)$movCount->fetchColumn();

            $procCount = $this->db->prepare("SELECT COUNT(*) FROM processes WHERE import_batch = ?");
            $procCount->execute([$batchId]);
            $procCount = (int)$procCount->fetchColumn();

            // Remove movimentações do lote
            $stmt = $this->db->prepare("DELETE FROM movements WHERE import_batch = ?");
            $stmt->execute([$batchId]);

            // Remove processos do lote
            $stmt = $this->db->prepare("DELETE FROM processes WHERE import_batch = ?");
            $stmt->execute([$batchId]);

            $this->db->commit();

            $removed = [
                'movements' => $movCount,
                'processes' => $procCount
            ];

            $this->logger->info($batchId, 'rollback', "Undo concluído", ['removed' => $removed]);

            return ['success' => true, 'removed' => $removed];

        } catch (\Exception $e) {
            $this->db->rollBack();
            $this->logger->error($batchId, 'rollback', 'Falha no undo: ' . $e->getMessage());
            throw $e;
        }
    }

    /**
     * Lista o histórico de importações enriquecido com dados de versões e resumo de logs.
     * 
     * @return array Lista de importações com metadados, status e contagens de log.
     */
    public function getImportHistory(): array {
        $stmt = $this->db->query("
            SELECT 
                iv.id,
                iv.batch_id,
                iv.version_label,
                iv.snapshot_file,
                iv.status,
                iv.stats_json,
                iv.error_message,
                iv.started_at,
                iv.completed_at,
                u.name as user_name,
                (SELECT COUNT(*) FROM import_logs il WHERE il.batch_id = iv.batch_id AND il.log_level = 'ERROR') as error_count,
                (SELECT COUNT(*) FROM import_logs il WHERE il.batch_id = iv.batch_id AND il.log_level = 'WARNING') as warning_count
            FROM import_versions iv
            JOIN users u ON iv.user_id = u.id
            ORDER BY iv.started_at DESC
        ");

        $history = $stmt->fetchAll(PDO::FETCH_ASSOC);

        // Deserializa stats_json
        foreach ($history as &$item) {
            if ($item['stats_json']) {
                $item['stats'] = json_decode($item['stats_json'], true);
            }
            unset($item['stats_json']);
        }

        return $history;
    }

    // ========================================================================
    // Métodos auxiliares privados
    // ========================================================================

    /**
     * Verifica se uma string de data é válida e no formato esperado.
     */
    private function isValidDate(string $date): bool {
        if (preg_match('/^\d{4}-\d{2}-\d{2}$/', $date) || preg_match('/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/', $date)) {
            try {
                $dt = new \DateTime($date);
                return $dt && $dt->format('Y-m-d') === substr($date, 0, 10);
            } catch (\Exception $e) {
                return false;
            }
        }
        return false;
    }

    /**
     * Tenta parsear uma data e retorna no formato MySQL ou null se inválida.
     */
    private function parseDate(string $date): ?string {
        if ($this->isValidDate($date)) {
            return $date;
        }
        return null;
    }

    /**
     * Verifica se o nome de um setor é inválido (lixo de digitação, pontuação isolada, etc.).
     */
    private function isInvalidSectorName(string $name): bool {
        if (empty($name) || trim($name) === '') return true;
        if (preg_match('/^[\s,\.\-\/]+$/', $name)) return true;
        if (preg_match('/\d+\//', $name)) return true;
        if (preg_match('/^[\d\/\-\.\s]+$/', $name)) return true;
        if (strlen(trim($name)) <= 1) return true;
        return false;
    }

    /**
     * Precarrega um cache de lookup (nome -> id) para uma tabela.
     */
    private function preloadCache(string $table, string $nameColumn): array {
        $cache = [];
        $stmt = $this->db->query("SELECT id, {$nameColumn} FROM {$table}");
        foreach ($stmt->fetchAll() as $row) {
            $cache[strtolower(trim($row[$nameColumn]))] = $row['id'];
        }
        return $cache;
    }

    /**
     * Constrói a lista de IDs de setores internos (hierarquia completa).
     */
    private function buildInternalHierarchy(): array {
        $stmt = $this->db->query("SELECT id, parent_id, is_internal FROM sectors");
        $allSectors = $stmt->fetchAll(PDO::FETCH_ASSOC);

        $centralOrgIds = [];
        foreach ($allSectors as $s) {
            if ($s['is_internal']) {
                $centralOrgIds[] = $s['id'];
            }
        }

        $internalDescendants = $centralOrgIds;
        $added = true;
        while ($added) {
            $added = false;
            foreach ($allSectors as $s) {
                if ($s['parent_id'] !== null && in_array($s['parent_id'], $internalDescendants) && !in_array($s['id'], $internalDescendants)) {
                    $internalDescendants[] = $s['id'];
                    $added = true;
                }
            }
        }

        return $internalDescendants;
    }
}
