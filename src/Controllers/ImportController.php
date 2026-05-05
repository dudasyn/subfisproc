<?php

namespace App\Controllers;

use App\Models\ImportVersion;
use App\Services\LoggerService;
use App\Services\SnapshotService;
use App\Services\ImportService;
use App\Utils\Response;

/**
 * Controller MVC para operações de importação de dados.
 * 
 * Substitui o módulo legado `api/import.php`, adicionando:
 * - Snapshot pré-importação automático
 * - Versionamento de importações
 * - Log de execução estruturado
 * - Restauração de snapshots anteriores
 * 
 * Todas as respostas seguem o padrão JSON da classe Response.
 */
class ImportController {

    /** @var ImportVersion Model de versões */
    private $versionModel;

    /** @var LoggerService Serviço de logging */
    private $logger;

    /** @var SnapshotService Serviço de snapshots */
    private $snapshotService;

    /** @var ImportService Serviço de importação */
    private $importService;

    public function __construct() {
        $this->versionModel = new ImportVersion();
        $this->logger = new LoggerService();
        $this->snapshotService = new SnapshotService($this->logger);
        $this->importService = new ImportService($this->logger);
    }

    /**
     * GET /api/import/history
     * Lista o histórico completo de importações com versões e resumo de logs.
     */
    public function history() {
        try {
            $this->requireAuth();
            $history = $this->importService->getImportHistory();
            return Response::json($history);
        } catch (\Exception $e) {
            return Response::json(['error' => $e->getMessage()], 500);
        }
    }

    /**
     * POST /api/import/validate
     * Pré-validação dos dados sem alterar o banco.
     * Retorna relatório de erros e avisos para preview.
     */
    public function validate() {
        try {
            $this->requireAuth();
            $data = $this->getJsonInput();

            $batchId = 'val_' . uniqid();
            
            // Cria registro de versão temporário para os logs de validação
            $this->versionModel->create([
                'batch_id' => $batchId,
                'version_label' => 'Validação prévia',
                'user_id' => $_SESSION['user_id']
            ]);

            $result = $this->importService->validateData($data, $batchId);
            $result['batch_id'] = $batchId;
            
            // Atualiza status baseado na validação
            $status = $result['valid'] ? 'completed' : 'failed';
            $this->versionModel->updateStatus($batchId, $status, [
                'total_rows' => $result['total_rows'],
                'errors' => count($result['errors']),
                'warnings' => count($result['warnings'])
            ]);

            return Response::json($result);
        } catch (\Exception $e) {
            return Response::json(['error' => $e->getMessage()], 500);
        }
    }

    /**
     * POST /api/import/execute
     * Executa importação completa com snapshot prévio e logging.
     * 
     * Fluxo:
     * 1. Cria registro de versão (status: pending)
     * 2. Gera snapshot pré-importação
     * 3. Atualiza status para running
     * 4. Executa importação transacional
     * 5. Atualiza status para completed ou failed
     */
    public function execute() {
        // Aumentar limites para grandes importações
        ini_set('memory_limit', '1024M');
        ini_set('max_execution_time', '600');

        try {
            $this->requireAuth();
            $data = $this->getJsonInput();

            $batchId = $_GET['batch_id'] ?? ('imp_' . uniqid());
            $userId = $_SESSION['user_id'];
            $versionNumber = $this->versionModel->count() + 1;

            $customLabel = isset($_GET['label']) ? trim($_GET['label']) : '';
            $versionLabel = !empty($customLabel) ? $customLabel : "v{$versionNumber} - Importação " . date('d/m/Y H:i');

            // 1. Criar registro de versão
            $this->versionModel->create([
                'batch_id' => $batchId,
                'version_label' => $versionLabel,
                'user_id' => $userId
            ]);

            $this->logger->info($batchId, 'import', 'Importação iniciada pelo usuário', [
                'user_id' => $userId,
                'total_rows' => count($data)
            ]);

            // 2. Gerar snapshot pré-importação
            try {
                $snapshotPath = $this->snapshotService->createSnapshot($batchId);
                $this->versionModel->updateSnapshotFile($batchId, $snapshotPath);

                // Rotacionar snapshots antigos
                $this->snapshotService->rotateSnapshots(10);
            } catch (\Exception $e) {
                // Snapshot falhou mas não impede a importação
                $this->logger->warning($batchId, 'snapshot', 'Snapshot falhou (importação prossegue): ' . $e->getMessage());
            }

            // 3. Atualizar status para running
            $this->versionModel->updateStatus($batchId, 'running');

            // 4. Executar importação
            $result = $this->importService->executeImport($data, $batchId, $userId);

            // 5. Atualizar status para completed
            $this->versionModel->updateStatus($batchId, 'completed', $result['stats']);

            // Incluir resumo de logs na resposta
            $logSummary = $this->logger->getSummary($batchId);
            $result['log_summary'] = $logSummary;

            return Response::json($result);

        } catch (\Exception $e) {
            if (isset($batchId)) {
                $this->versionModel->updateStatus($batchId, 'failed', null, $e->getMessage());
            }
            return Response::json(['error' => 'Falha na importação: ' . $e->getMessage()], 500);
        }
    }

    /**
     * DELETE /api/import/batch
     * Desfaz um lote de importação específico.
     * Requer parâmetro GET: ?batch=BATCH_ID
     */
    public function undo() {
        try {
            $this->requireAuth();
            $this->requireRole(['Admin', 'Gestor']);

            $batchId = $_GET['batch'] ?? '';
            if (empty($batchId)) {
                return Response::json(['error' => 'Parâmetro batch não informado'], 400);
            }

            $result = $this->importService->undoBatch($batchId);

            // Atualizar status da versão
            $this->versionModel->updateStatus($batchId, 'rolled_back', $result['removed']);

            return Response::json($result);
        } catch (\Exception $e) {
            return Response::json(['error' => 'Falha ao desfazer: ' . $e->getMessage()], 500);
        }
    }

    /**
     * POST /api/import/restore
     * Restaura o banco de dados a partir de um snapshot anterior.
     * Requer body JSON: {"batch_id": "imp_xxx"} ou {"snapshot_file": "/path/to/file.sql"}
     */
    public function restore() {
        try {
            $this->requireAuth();
            $this->requireRole(['Admin']);

            $input = $this->getJsonInput();

            // Determinar o arquivo de snapshot
            $snapshotFile = null;
            if (!empty($input['snapshot_file'])) {
                $snapshotFile = $input['snapshot_file'];
            } elseif (!empty($input['batch_id'])) {
                $version = $this->versionModel->getByBatchId($input['batch_id']);
                if (!$version || empty($version['snapshot_file'])) {
                    return Response::json(['error' => 'Snapshot não encontrado para este lote'], 404);
                }
                $snapshotFile = $version['snapshot_file'];
            } else {
                return Response::json(['error' => 'Informe batch_id ou snapshot_file'], 400);
            }

            // Criar registro de versão para a restauração
            $restoreBatchId = 'rst_' . uniqid();
            $this->versionModel->create([
                'batch_id' => $restoreBatchId,
                'version_label' => 'Restauração de snapshot: ' . basename($snapshotFile),
                'user_id' => $_SESSION['user_id']
            ]);

            $this->versionModel->updateStatus($restoreBatchId, 'running');

            // Criar snapshot do estado atual ANTES de restaurar
            try {
                $preRestoreSnapshot = $this->snapshotService->createSnapshot($restoreBatchId);
                $this->versionModel->updateSnapshotFile($restoreBatchId, $preRestoreSnapshot);
            } catch (\Exception $e) {
                $this->logger->warning($restoreBatchId, 'restore', 'Snapshot pré-restauração falhou: ' . $e->getMessage());
            }

            // Executar restauração
            $this->snapshotService->restoreSnapshot($snapshotFile, $restoreBatchId);
            $this->versionModel->updateStatus($restoreBatchId, 'completed');

            return Response::json([
                'success' => true,
                'message' => 'Banco restaurado com sucesso a partir de: ' . basename($snapshotFile),
                'restore_batch_id' => $restoreBatchId
            ]);

        } catch (\Exception $e) {
            if (isset($restoreBatchId)) {
                $this->versionModel->updateStatus($restoreBatchId, 'failed', null, $e->getMessage());
            }
            return Response::json(['error' => 'Falha na restauração: ' . $e->getMessage()], 500);
        }
    }

    /**
     * POST /api/import/snapshot
     * Cria um snapshot de segurança manual da base de dados.
     */
    public function createManual() {
        try {
            $this->requireAuth();
            $this->requireRole(['Admin']);

            $batchId = 'man_' . uniqid();
            $userId = $_SESSION['user_id'];
            $versionNumber = $this->versionModel->count() + 1;

            $this->versionModel->create([
                'batch_id' => $batchId,
                'version_label' => "Backup Manual v{$versionNumber}",
                'user_id' => $userId
            ]);

            $this->logger->info($batchId, 'snapshot', 'Backup manual iniciado pelo usuário');
            
            $snapshotPath = $this->snapshotService->createSnapshot($batchId);
            $this->versionModel->updateSnapshotFile($batchId, $snapshotPath);
            $this->versionModel->updateStatus($batchId, 'completed', [
                'type' => 'manual',
                'message' => 'Backup manual concluído com sucesso'
            ]);

            // Rotacionar snapshots antigos
            $this->snapshotService->rotateSnapshots(10);

            return Response::json([
                'success' => true,
                'message' => 'Snapshot criado com sucesso!',
                'batch_id' => $batchId,
                'file' => basename($snapshotPath)
            ]);
        } catch (\Exception $e) {
            if (isset($batchId)) {
                $this->versionModel->updateStatus($batchId, 'failed', null, $e->getMessage());
            }
            return Response::json(['error' => 'Falha ao criar snapshot: ' . $e->getMessage()], 500);
        }
    }

    /**
     * GET /api/import/snapshots
     * Lista todos os snapshots disponíveis com metadados.
     */
    public function snapshots() {
        try {
            $this->requireAuth();
            $snapshots = $this->snapshotService->listSnapshots();
            return Response::json($snapshots);
        } catch (\Exception $e) {
            return Response::json(['error' => $e->getMessage()], 500);
        }
    }

    /**
     * GET /api/import/logs
     * Consulta logs de um batch de importação.
     * Parâmetros GET: ?batch=BATCH_ID&level=ERROR (opcional)
     */
    public function logs() {
        try {
            $this->requireAuth();

            $batchId = $_GET['batch'] ?? '';
            if (empty($batchId)) {
                return Response::json(['error' => 'Parâmetro batch não informado'], 400);
            }

            $level = $_GET['level'] ?? null;
            $logs = $this->logger->getLogsByBatch($batchId, $level);
            $summary = $this->logger->getSummary($batchId);

            return Response::json([
                'batch_id' => $batchId,
                'summary' => $summary,
                'logs' => $logs
            ]);
        } catch (\Exception $e) {
            return Response::json(['error' => $e->getMessage()], 500);
        }
    }

    /**
     * DELETE /api/import/wipe
     * Reset nuclear: limpa todas as tabelas de dados exceto usuários.
     * Apenas Admin pode executar.
     */
    public function wipe() {
        try {
            $this->requireAuth();
            $this->requireRole(['Admin']);

            $wipeBatchId = 'wipe_' . uniqid();
            $this->versionModel->create([
                'batch_id' => $wipeBatchId,
                'version_label' => 'Reset Nuclear ' . date('d/m/Y H:i'),
                'user_id' => $_SESSION['user_id']
            ]);

            // Snapshot de segurança antes do wipe
            try {
                $snapshotPath = $this->snapshotService->createSnapshot($wipeBatchId);
                $this->versionModel->updateSnapshotFile($wipeBatchId, $snapshotPath);
            } catch (\Exception $e) {
                $this->logger->warning($wipeBatchId, 'snapshot', 'Snapshot pré-wipe falhou: ' . $e->getMessage());
            }

            $this->versionModel->updateStatus($wipeBatchId, 'running');

            $db = \App\Config\Database::getConnection();
            $db->beginTransaction();

            $db->exec('DELETE FROM movements');
            $db->exec('DELETE FROM responsible_sectors');
            $db->exec('DELETE FROM responsibles');
            $db->exec('DELETE FROM processes');
            $db->exec('DELETE FROM sectors WHERE id NOT IN (SELECT DISTINCT sector_id FROM users WHERE sector_id IS NOT NULL)');

            $db->commit();

            $this->versionModel->updateStatus($wipeBatchId, 'completed', [
                'action' => 'wipe',
                'message' => 'Sistema resetado com sucesso'
            ]);

            $this->logger->info($wipeBatchId, 'import', 'Reset nuclear executado com sucesso');

            return Response::json(['success' => true, 'message' => 'Sistema resetado com sucesso!']);

        } catch (\Exception $e) {
            if (isset($db) && $db->inTransaction()) {
                $db->rollBack();
            }
            if (isset($wipeBatchId)) {
                $this->versionModel->updateStatus($wipeBatchId, 'failed', null, $e->getMessage());
            }
            return Response::json(['error' => 'Falha ao resetar sistema: ' . $e->getMessage()], 500);
        }
    }

    /**
     * POST /api/import/legacy-sql
     * Importação exclusiva para .sql de bases legadas.
     */
    public function importLegacySql() {
        try {
            $this->requireAuth();
            $this->requireRole(['Admin']);

            if (!isset($_FILES['sql_file']) || $_FILES['sql_file']['error'] !== UPLOAD_ERR_OK) {
                return Response::json(['error' => 'Arquivo .sql não enviado ou erro no envio'], 400);
            }

            $file = $_FILES['sql_file'];
            $extension = strtolower(pathinfo($file['name'], PATHINFO_EXTENSION));
            if ($extension !== 'sql') {
                return Response::json(['error' => 'Apenas arquivos .sql são permitidos'], 400);
            }

            // Define o batch ID e o local final do arquivo de snapshot
            $batchId = 'leg_' . uniqid();
            $timestamp = date('Ymd_His');
            $filename = "snap_{$timestamp}_{$batchId}.sql";
            $snapshotDir = __DIR__ . '/../../data/snapshots';
            
            if (!is_dir($snapshotDir)) {
                mkdir($snapshotDir, 0755, true);
            }
            $destPath = $snapshotDir . '/' . $filename;

            // Move o arquivo enviado para a pasta de snapshots
            if (!move_uploaded_file($file['tmp_name'], $destPath)) {
                return Response::json(['error' => 'Falha ao salvar arquivo no servidor'], 500);
            }

            $userId = $_SESSION['user_id'];
            $versionLabel = "Importação de Base Legada (.sql): " . basename($file['name']);

            // 1. Criar registro de versão
            $this->versionModel->create([
                'batch_id' => $batchId,
                'version_label' => $versionLabel,
                'user_id' => $userId
            ]);

            $this->versionModel->updateStatus($batchId, 'running');

            $this->logger->info($batchId, 'restore', "Iniciando importação de base de dados legada .sql: " . $file['name']);

            // 2. Criar snapshot do estado atual ANTES de restaurar a base legada
            try {
                $preRestoreSnapshot = $this->snapshotService->createSnapshot($batchId);
                $this->versionModel->updateSnapshotFile($batchId, $preRestoreSnapshot);
            } catch (\Exception $e) {
                $this->logger->warning($batchId, 'restore', 'Snapshot pré-importação legada falhou: ' . $e->getMessage());
            }

            // 2.5 Remover tabelas existentes para evitar conflitos com CREATE TABLE do dump
            try {
                $db = \App\Config\Database::getConnection();
                $db->exec('SET FOREIGN_KEY_CHECKS = 0');
                $db->exec('DROP TABLE IF EXISTS `movements`');
                $db->exec('DROP TABLE IF EXISTS `responsible_sectors`');
                $db->exec('DROP TABLE IF EXISTS `responsibles`');
                $db->exec('DROP TABLE IF EXISTS `processes`');
                $db->exec('DROP TABLE IF EXISTS `sectors`');
                $db->exec('DROP TABLE IF EXISTS `users`');
                $db->exec('SET FOREIGN_KEY_CHECKS = 1');
                $this->logger->info($batchId, 'restore', 'Tabelas antigas deletadas preventivamente para importação legada');
            } catch (\Exception $e) {
                $this->logger->warning($batchId, 'restore', 'Falha ao deletar tabelas preventivamente: ' . $e->getMessage());
            }

            // 3. Executar restauração usando o arquivo enviado
            $this->snapshotService->restoreSnapshot($destPath, $batchId);

            // 3.5 Resetar as senhas das contas de Admin para 'admin123'
            try {
                $adminHash = '$2y$10$wT6yCyVa4P0zp.2QM18RR.QKmbxGWso26V9/bjo8hcAD0ikKtvO/a';
                $db = \App\Config\Database::getConnection();
                $stmt = $db->prepare("UPDATE users SET password = ? WHERE role = 'Admin' OR email IN ('admin@subfis.gov', 'felipealvesbento@gmail.com')");
                $stmt->execute([$adminHash]);
                $this->logger->info($batchId, 'restore', 'Senhas administrativas redefinidas para admin123');
            } catch (\Exception $e) {
                $this->logger->warning($batchId, 'restore', 'Falha ao redefinir senhas administrativas: ' . $e->getMessage());
            }

            $this->versionModel->updateStatus($batchId, 'completed');

            $this->logger->info($batchId, 'restore', "Base legada importada com sucesso a partir de " . $file['name']);

            return Response::json([
                'success' => true,
                'message' => 'Base legada importada com sucesso!',
                'batch_id' => $batchId
            ]);

        } catch (\Exception $e) {
            if (isset($batchId)) {
                $this->versionModel->updateStatus($batchId, 'failed', null, $e->getMessage());
            }
            return Response::json(['error' => 'Falha ao importar base legada: ' . $e->getMessage()], 500);
        }
    }

    // ========================================================================
    // Métodos auxiliares
    // ========================================================================

    /**
     * Verifica se o usuário está autenticado via sessão.
     * @throws \Exception Se não autenticado.
     */
    private function requireAuth(): void {
        if (!isset($_SESSION['user_id'])) {
            Response::json(['error' => 'Não autorizado'], 401);
            exit;
        }
    }

    /**
     * Verifica se o usuário tem uma das roles permitidas.
     * @param array $allowedRoles  Lista de roles permitidas.
     */
    private function requireRole(array $allowedRoles): void {
        if (!isset($_SESSION['role']) || !in_array($_SESSION['role'], $allowedRoles)) {
            Response::json(['error' => 'Permissão insuficiente'], 403);
            exit;
        }
    }

    /**
     * Lê e decodifica o corpo da requisição como JSON.
     * @return array Dados decodificados.
     */
    private function getJsonInput(): array {
        $data = json_decode(file_get_contents('php://input'), true);
        if (!is_array($data)) {
            Response::json(['error' => 'Formato de dados inválido. Esperado JSON.'], 400);
            exit;
        }
        return $data;
    }
}
