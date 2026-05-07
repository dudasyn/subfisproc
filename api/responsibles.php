<?php
require 'config.php';
checkAuth();

header('Content-Type: application/json');

$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'GET') {
    // Return all active responsibles with their sectors (joined)
    $stmt = $pdo->query('
        SELECT r.id, r.name, r.active, r.created_at,
               GROUP_CONCAT(s.id ORDER BY s.name SEPARATOR ",") as sector_ids,
               GROUP_CONCAT(s.name ORDER BY s.name SEPARATOR ", ") as sector_name,
               (SELECT COUNT(*) 
                FROM movements m2 
                INNER JOIN (
                    SELECT process_id, MAX(id) as max_id 
                    FROM movements 
                    GROUP BY process_id
                ) latest ON m2.id = latest.max_id 
                WHERE m2.responsible_id = r.id) as stationed_processes_count
        FROM responsibles r
        LEFT JOIN responsible_sectors rs ON r.id = rs.responsible_id
        LEFT JOIN sectors s ON rs.sector_id = s.id
        WHERE r.active = 1
        GROUP BY r.id
        ORDER BY r.name ASC
    ');
    jsonResponse($stmt->fetchAll());

} elseif ($method === 'POST') {
    $data = json_decode(file_get_contents('php://input'), true);
    $action = $data['action'] ?? '';

    if ($action === 'clear_all_sectors') {
        try {
            $pdo->exec('DELETE FROM responsible_sectors');
            jsonResponse(['success' => true, 'message' => 'Vínculos de todos os responsáveis limpos com sucesso']);
        } catch (Exception $e) {
            jsonResponse(['error' => 'Falha ao limpar setores: ' . $e->getMessage()], 500);
        }
    }

    if ($action === 'merge') {
        $source_id = (int)($data['source_id'] ?? 0);
        $target_id = (int)($data['target_id'] ?? 0);
        
        if (!$source_id || !$target_id || $source_id === $target_id) {
            jsonResponse(['error' => 'ID de origem e destino inválidos ou iguais'], 400);
        }

        try {
            $pdo->beginTransaction();
            
            // 1. Update Movements (responsible_id)
            $stmt = $pdo->prepare('UPDATE movements SET responsible_id = ? WHERE responsible_id = ?');
            $stmt->execute([$target_id, $source_id]);
            
            // 2. Deactivate Source Responsible
            $stmt = $pdo->prepare('UPDATE responsibles SET active = 0 WHERE id = ?');
            $stmt->execute([$source_id]);
            
            $pdo->commit();
            jsonResponse(['success' => true, 'message' => 'Responsáveis mesclados com sucesso']);
        } catch (Exception $e) {
            $pdo->rollBack();
            jsonResponse(['error' => 'Falha ao mesclar responsáveis: ' . $e->getMessage()], 500);
        }
    }

    $name = trim($data['name'] ?? '');
    $sector_ids = $data['sector_ids'] ?? []; // array of sector IDs

    if (empty($name)) jsonResponse(['error' => 'Nome é obrigatório'], 400);

    $pdo->beginTransaction();
    try {
        $stmt = $pdo->prepare('INSERT INTO responsibles (name) VALUES (?)');
        $stmt->execute([$name]);
        $resp_id = $pdo->lastInsertId();

        if (!empty($sector_ids)) {
            $stmt2 = $pdo->prepare('INSERT IGNORE INTO responsible_sectors (responsible_id, sector_id) VALUES (?, ?)');
            foreach ($sector_ids as $sid) {
                $stmt2->execute([$resp_id, $sid]);
            }
        }
        $pdo->commit();
        jsonResponse(['id' => $resp_id, 'name' => $name, 'active' => 1]);
    } catch (Exception $e) {
        $pdo->rollBack();
        jsonResponse(['error' => $e->getMessage()], 500);
    }

} elseif ($method === 'PUT') {
    $data = json_decode(file_get_contents('php://input'), true);
    $id = $data['id'] ?? 0;
    $name = trim($data['name'] ?? '');
    $sector_ids = $data['sector_ids'] ?? [];

    if (!$id || empty($name)) jsonResponse(['error' => 'ID e Nome são obrigatórios'], 400);

    // Check stationed processes
    $stmtCount = $pdo->prepare('
        SELECT COUNT(*) 
        FROM movements m2 
        INNER JOIN (
            SELECT process_id, MAX(id) as max_id 
            FROM movements 
            GROUP BY process_id
        ) latest ON m2.id = latest.max_id 
        WHERE m2.responsible_id = ?
    ');
    $stmtCount->execute([$id]);
    $stationed_count = (int)$stmtCount->fetchColumn();

    if ($stationed_count > 0) {
        $stmtOldSectors = $pdo->prepare('SELECT sector_id FROM responsible_sectors WHERE responsible_id = ?');
        $stmtOldSectors->execute([$id]);
        $old_sectors = $stmtOldSectors->fetchAll(PDO::FETCH_COLUMN);
        
        $old_sorted = array_map('intval', $old_sectors); sort($old_sorted);
        $new_sorted = array_map('intval', $sector_ids); sort($new_sorted);
        
        if (implode(',', $old_sorted) !== implode(',', $new_sorted)) {
            jsonResponse(['error' => "Não é possível alterar os setores deste auditor pois ele possui $stationed_count processo(s) parado(s) sob sua responsabilidade. Zere a carga antes de remanejá-lo."], 400);
        }
    }

    $pdo->beginTransaction();
    try {
        $stmt = $pdo->prepare('UPDATE responsibles SET name = ? WHERE id = ?');
        $stmt->execute([$name, $id]);

        // Replace all sector associations
        $pdo->prepare('DELETE FROM responsible_sectors WHERE responsible_id = ?')->execute([$id]);
        if (!empty($sector_ids)) {
            $stmt2 = $pdo->prepare('INSERT IGNORE INTO responsible_sectors (responsible_id, sector_id) VALUES (?, ?)');
            foreach ($sector_ids as $sid) {
                $stmt2->execute([$id, $sid]);
            }
        }
        $pdo->commit();
        jsonResponse(['success' => true]);
    } catch (Exception $e) {
        $pdo->rollBack();
        jsonResponse(['error' => $e->getMessage()], 500);
    }

} elseif ($method === 'DELETE') {
    $id = $_GET['id'] ?? 0;
    if (!$id) jsonResponse(['error' => 'ID é obrigatório'], 400);

    $stmtCount = $pdo->prepare('
        SELECT COUNT(*) 
        FROM movements m2 
        INNER JOIN (
            SELECT process_id, MAX(id) as max_id 
            FROM movements 
            GROUP BY process_id
        ) latest ON m2.id = latest.max_id 
        WHERE m2.responsible_id = ?
    ');
    $stmtCount->execute([$id]);
    $stationed_count = (int)$stmtCount->fetchColumn();

    if ($stationed_count > 0) {
        jsonResponse(['error' => "Não é possível excluir este responsável pois ele possui $stationed_count processo(s) parados(s) com ele."], 400);
    }

    $stmt = $pdo->prepare('UPDATE responsibles SET active = 0 WHERE id = ?');
    $stmt->execute([$id]);
    jsonResponse(['success' => true]);
} else {
    jsonResponse(['error' => 'Método inválido'], 405);
}