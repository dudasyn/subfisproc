<?php
require 'config.php';
checkAuth();

header('Content-Type: application/json');

$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'GET') {
    $include_inactive = isset($_GET['include_inactive']) && $_GET['include_inactive'] == 1;
    
    $where_clause = "WHERE s.active = 1";
    if ($include_inactive) {
        // Se pedir inativos, mostramos apenas os que têm alguma movimentação (para limpar lixo)
        $where_clause = "WHERE s.active = 1 OR EXISTS (SELECT 1 FROM movements m WHERE m.destination_sector_id = s.id)";
    }

    $stmt = $pdo->query("
        SELECT s.*, 
        (SELECT COUNT(*) FROM sectors s2 WHERE s2.parent_id = s.id AND s2.active = 1) as children_count,
        (SELECT COUNT(*) FROM movements m WHERE m.destination_sector_id = s.id) as movement_count
        FROM sectors s 
        $where_clause 
        ORDER BY 
            s.active DESC,
            (s.parent_id IS NOT NULL) ASC, 
            (CASE WHEN (SELECT COUNT(*) FROM sectors s2 WHERE s2.parent_id = s.id AND s2.active = 1) > 0 THEN 0 ELSE 1 END) ASC,
            s.name ASC
    ");
    $sectors = $stmt->fetchAll(PDO::FETCH_ASSOC);

    // Encontrar todos os setores marcados como "Órgão Central" (is_internal = 1)
    $central_org_ids = [];
    foreach ($sectors as $s) {
        if ($s['is_internal']) {
            $central_org_ids[] = $s['id'];
        }
    }

    // Coletar todos os descendentes recursivamente
    $internal_descendants = $central_org_ids;
    $added = true;
    while ($added) {
        $added = false;
        foreach ($sectors as $s) {
            if ($s['parent_id'] !== null && in_array($s['parent_id'], $internal_descendants) && !in_array($s['id'], $internal_descendants)) {
                $internal_descendants[] = $s['id'];
                $added = true;
            }
        }
    }

    foreach ($sectors as &$s) {
        $s['is_internal_hierarchy'] = in_array($s['id'], $internal_descendants);
    }

    jsonResponse($sectors);
} elseif ($method === 'POST') {
    $data = json_decode(file_get_contents('php://input'), true);
    $action = $data['action'] ?? '';

    if ($action === 'merge') {
        $source_id = (int)($data['source_id'] ?? 0);
        $target_id = (int)($data['target_id'] ?? 0);
        
        if (!$source_id || !$target_id || $source_id === $target_id) {
            jsonResponse(['error' => 'ID de origem e destino inválidos ou iguais'], 400);
        }

        try {
            $pdo->beginTransaction();
            
            // 1. Update Movements (destination_sector_id)
            $stmt = $pdo->prepare('UPDATE movements SET destination_sector_id = ? WHERE destination_sector_id = ?');
            $stmt->execute([$target_id, $source_id]);
            
            // 2. Update Users (sector_id)
            $stmt = $pdo->prepare('UPDATE users SET sector_id = ? WHERE sector_id = ?');
            $stmt->execute([$target_id, $source_id]);
            
            // 3. Update Responsibles (Primary column)
            $stmt = $pdo->prepare('UPDATE responsibles SET sector_id = ? WHERE sector_id = ?');
            $stmt->execute([$target_id, $source_id]);

            // 3.1 Update pivot table (IGNORE duplicates, then delete leftovers)
            $stmt = $pdo->prepare('UPDATE IGNORE responsible_sectors SET sector_id = ? WHERE sector_id = ?');
            $stmt->execute([$target_id, $source_id]);
            
            $stmt = $pdo->prepare('DELETE FROM responsible_sectors WHERE sector_id = ?');
            $stmt->execute([$source_id]);
            
            // 4. Deactivate Source Sector
            $stmt = $pdo->prepare('UPDATE sectors SET active = 0 WHERE id = ?');
            $stmt->execute([$source_id]);
            
            $pdo->commit();
            jsonResponse(['success' => true, 'message' => 'Setores mesclados com sucesso']);
        } catch (Exception $e) {
            $pdo->rollBack();
            jsonResponse(['error' => 'Falha ao mesclar setores: ' . $e->getMessage()], 500);
        }
        exit;
    }
    
    $name = trim($data['name'] ?? '');
    $alias = trim($data['alias'] ?? '');
    $parent_id = !empty($data['parent_id']) ? (int)$data['parent_id'] : null;
    $is_internal = isset($data['is_internal']) ? (int)$data['is_internal'] : 1;
    if (empty($name)) jsonResponse(['error' => 'Nome do setor é obrigatório'], 400);

    $stmt = $pdo->prepare('INSERT INTO sectors (name, alias, parent_id, is_internal) VALUES (?, ?, ?, ?)');
    $stmt->execute([$name, $alias, $parent_id, $is_internal]);
    jsonResponse(['id' => $pdo->lastInsertId(), 'parent_id' => $parent_id, 'name' => $name, 'alias' => $alias, 'is_internal' => $is_internal, 'active' => 1]);
} elseif ($method === 'PUT') {
    $data = json_decode(file_get_contents('php://input'), true);
    
    $id = $data['id'] ?? 0;
    $name = trim($data['name'] ?? '');
    $alias = trim($data['alias'] ?? '');
    $parent_id = !empty($data['parent_id']) ? (int)$data['parent_id'] : null;
    $is_internal = isset($data['is_internal']) ? (int)$data['is_internal'] : 1;
    if (!$id || empty($name)) jsonResponse(['error' => 'ID e Nome são obrigatórios'], 400);

    $stmt = $pdo->prepare('UPDATE sectors SET name = ?, alias = ?, parent_id = ?, is_internal = ? WHERE id = ?');
    $stmt->execute([$name, $alias, $parent_id, $is_internal, $id]);
    jsonResponse(['success' => true]);
} elseif ($method === 'DELETE') {
    $id = $_GET['id'] ?? 0;
    
    if (!$id) jsonResponse(['error' => 'ID é obrigatório'], 400);

    if ($id === 'all') {
        $stmt = $pdo->prepare('UPDATE sectors SET active = 0 WHERE id > 0');
        $stmt->execute();
    } else {
        // Soft delete to maintain history in movements and users
        $stmt = $pdo->prepare('UPDATE sectors SET active = 0 WHERE id = ?');
        $stmt->execute([$id]);
    }
    jsonResponse(['success' => true]);
} else {
    jsonResponse(['error' => 'Método inválido'], 405);
}
?>
