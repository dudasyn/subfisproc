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

            // 1. Criar registro de versão
            $this->versionModel->create([
                'batch_id' => $batchId,
                'version_label' => "v{$versionNumber} - Importação " . date('d/m/Y H:i'),
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
     * Cria um snapshot manual do estado atual do banco.
     */
    public function createSnapshot() {
        try {
            $this->requireAuth();
            $this->requireRole(['Admin', 'Gestor']);

            $batchId = 'man_' . uniqid();
            $this->versionModel->create([
                'batch_id' => $batchId,
                'version_label' => 'Snapshot Manual ' . date('d/m/Y H:i'),
                'user_id' => $_SESSION['user_id']
            ]);

            $path = $this->snapshotService->createSnapshot($batchId);
            $this->versionModel->updateSnapshotFile($batchId, $path);
            $this->versionModel->updateStatus($batchId, 'completed');

            return Response::json([
                'success' => true,
                'message' => 'Snapshot criado com sucesso!',
                'file' => basename($path)
            ]);
        } catch (\Exception $e) {
            return Response::json(['error' => $e->getMessage()], 500);
        }
    }

    /**
     * GET /api/import/snapshots
     * Lista todos os snapshots disponíveis com metadados e labels amigáveis.
     */
    public function snapshots() {
        try {
            $this->requireAuth();
            $snapshots = $this->snapshotService->listSnapshots();
            
            // Enriquecer com labels do banco de dados
            foreach ($snapshots as &$snap) {
                if ($snap['batch_id']) {
                    $version = $this->versionModel->getByBatchId($snap['batch_id']);
                    $snap['label'] = $version['version_label'] ?? ($snap['batch_id'] === 'LEGADO' ? 'Base de Dados Original (Legado)' : null);
                }
            }
            
            return Response::json($snapshots);
        } catch (\Exception $e) {
            return Response::json(['error' => $e->getMessage()], 500);
        }
    }

    /**
     * GET /api/import/backup
     * Gera um snapshot imediato e faz o download do arquivo SQL.
     */
    public function downloadBackup() {
        try {
            $this->requireAuth();
            $batchId = 'bkp_' . date('His');
            $path = $this->snapshotService->createSnapshot($batchId);
            
            header('Content-Type: application/sql');
            header('Content-Disposition: attachment; filename="' . basename($path) . '"');
            header('Content-Length: ' . filesize($path));
            readfile($path);
            exit;
        } catch (\Exception $e) {
            return Response::json(['error' => $e->getMessage()], 500);
        }
    }

    /**
     * POST /api/import/upload-sql
     * Recebe um arquivo .sql via upload e salva no diretório de snapshots.
     */
    public function uploadSql() {
        try {
            $this->requireAuth();
            $this->requireRole(['Admin']);

            if (!isset($_FILES['sql_file'])) {
                return Response::json(['error' => 'Nenhum arquivo enviado'], 400);
            }

            $file = $_FILES['sql_file'];
            if ($file['error'] !== UPLOAD_ERR_OK) {
                return Response::json(['error' => 'Erro no upload: ' . $file['error']], 400);
            }

            $filename = 'snap_' . date('Ymd_His') . '_UPL_' . basename($file['name']);
            // Remove espaços e caracteres especiais do nome original para segurança
            $filename = preg_replace('/[^a-zA-Z0-9._-]/', '_', $filename);
            
            $targetPath = __DIR__ . '/../../data/snapshots/' . $filename;
            
            if (move_uploaded_file($file['tmp_name'], $targetPath)) {
                return Response::json([
                    'success' => true,
                    'message' => 'Arquivo SQL enviado com sucesso e está pronto para restauração.',
                    'filename' => $filename
                ]);
            } else {
                return Response::json(['error' => 'Falha ao mover arquivo para o destino'], 500);
            }
        } catch (\Exception $e) {
            return Response::json(['error' => $e->getMessage()], 500);
        }
    }

    /**
     * GET /api/import/download-snapshot
     * Faz o download de um snapshot específico da pasta data/snapshots.
     */
    public function downloadSnapshot() {
        try {
            $this->requireAuth();
            $filename = $_GET['file'] ?? '';
            if (empty($filename)) return Response::json(['error' => 'Arquivo não informado'], 400);

            // Segurança: impede path traversal
            $filename = basename($filename);
            $path = __DIR__ . '/../../data/snapshots/' . $filename;

            if (!file_exists($path)) {
                return Response::json(['error' => 'Arquivo não encontrado'], 404);
            }

            header('Content-Type: application/sql');
            header('Content-Disposition: attachment; filename="' . $filename . '"');
            header('Content-Length: ' . filesize($path));
            readfile($path);
            exit;
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
        if (!isset($_SESSION['user_role']) || !in_array($_SESSION['user_role'], $allowedRoles)) {
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
