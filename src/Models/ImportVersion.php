<?php

namespace App\Models;

use App\Config\Database;
use PDO;

/**
 * Model para a tabela `import_versions`.
 * 
 * Gerencia os registros de versionamento de importação, incluindo status,
 * referência ao snapshot e estatísticas de cada operação.
 */
class ImportVersion {

    /** @var PDO Conexão com o banco de dados */
    private $db;

    public function __construct() {
        $this->db = Database::getConnection();
    }

    /**
     * Cria um novo registro de versão de importação.
     * 
     * @param array $data  Dados da versão: batch_id, version_label, user_id, [snapshot_file].
     * @return int ID do registro criado.
     */
    public function create(array $data): int {
        $stmt = $this->db->prepare("
            INSERT INTO import_versions (batch_id, version_label, snapshot_file, status, user_id) 
            VALUES (?, ?, ?, 'pending', ?)
        ");
        $stmt->execute([
            $data['batch_id'],
            $data['version_label'],
            $data['snapshot_file'] ?? null,
            $data['user_id']
        ]);
        return (int)$this->db->lastInsertId();
    }

    /**
     * Atualiza o status de uma versão de importação.
     * 
     * @param string $batchId  Identificador do lote.
     * @param string $status  Novo status: 'pending', 'running', 'completed', 'failed', 'rolled_back'.
     * @param array|null $stats  Estatísticas da importação (será salvo como JSON).
     * @param string|null $error  Mensagem de erro (para status 'failed').
     * @return bool True se atualizado com sucesso.
     */
    public function updateStatus(string $batchId, string $status, ?array $stats = null, ?string $error = null): bool {
        $sql = "UPDATE import_versions SET status = ?";
        $params = [$status];

        if ($stats !== null) {
            $sql .= ", stats_json = ?";
            $params[] = json_encode($stats, JSON_UNESCAPED_UNICODE);
        }

        if ($error !== null) {
            $sql .= ", error_message = ?";
            $params[] = $error;
        }

        if (in_array($status, ['completed', 'failed', 'rolled_back'])) {
            $sql .= ", completed_at = NOW()";
        }

        $sql .= " WHERE batch_id = ?";
        $params[] = $batchId;

        $stmt = $this->db->prepare($sql);
        return $stmt->execute($params);
    }

    /**
     * Atualiza o caminho do arquivo de snapshot de uma versão.
     * 
     * @param string $batchId  Identificador do lote.
     * @param string $snapshotFile  Caminho absoluto do arquivo de snapshot.
     * @return bool True se atualizado com sucesso.
     */
    public function updateSnapshotFile(string $batchId, string $snapshotFile): bool {
        $stmt = $this->db->prepare("UPDATE import_versions SET snapshot_file = ? WHERE batch_id = ?");
        return $stmt->execute([$snapshotFile, $batchId]);
    }

    /**
     * Retorna todas as versões de importação ordenadas da mais recente à mais antiga.
     * 
     * @return array Lista de versões com metadados.
     */
    public function getAll(): array {
        $stmt = $this->db->query("
            SELECT iv.*, u.name as user_name 
            FROM import_versions iv 
            JOIN users u ON iv.user_id = u.id 
            ORDER BY iv.started_at DESC
        ");
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    /**
     * Busca uma versão por ID.
     * 
     * @param int $id  ID do registro.
     * @return array|null Dados da versão ou null se não encontrada.
     */
    public function getById(int $id): ?array {
        $stmt = $this->db->prepare("SELECT * FROM import_versions WHERE id = ?");
        $stmt->execute([$id]);
        $result = $stmt->fetch(PDO::FETCH_ASSOC);
        return $result ?: null;
    }

    /**
     * Busca uma versão pelo batch_id.
     * 
     * @param string $batchId  Identificador do lote.
     * @return array|null Dados da versão ou null se não encontrada.
     */
    public function getByBatchId(string $batchId): ?array {
        $stmt = $this->db->prepare("SELECT * FROM import_versions WHERE batch_id = ?");
        $stmt->execute([$batchId]);
        $result = $stmt->fetch(PDO::FETCH_ASSOC);
        return $result ?: null;
    }

    /**
     * Conta o total de versões de importação.
     * 
     * @return int Total de registros.
     */
    public function count(): int {
        return (int)$this->db->query("SELECT COUNT(*) FROM import_versions")->fetchColumn();
    }
}
