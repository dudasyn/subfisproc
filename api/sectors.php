<?php
require 'config.php';
checkAuth();

header('Content-Type: application/json');

$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'GET') {
    $stmt = $pdo->query('SELECT id, name, active, created_at FROM sectors WHERE active = 1 ORDER BY name ASC');
    jsonResponse($stmt->fetchAll());
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
            
            // 3. Update Responsibles (sector_id)
            $stmt = $pdo->prepare('UPDATE responsibles SET sector_id = ? WHERE sector_id = ?');
            $stmt->execute([$target_id, $source_id]);
            
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
    if (empty($name)) jsonResponse(['error' => 'Nome do setor é obrigatório'], 400);

    $stmt = $pdo->prepare('INSERT INTO sectors (name) VALUES (?)');
    $stmt->execute([$name]);
    jsonResponse(['id' => $pdo->lastInsertId(), 'name' => $name, 'active' => 1]);
} elseif ($method === 'PUT') {
    $data = json_decode(file_get_contents('php://input'), true);
    
    $id = $data['id'] ?? 0;
    $name = trim($data['name'] ?? '');
    if (!$id || empty($name)) jsonResponse(['error' => 'ID e Nome são obrigatórios'], 400);

    $stmt = $pdo->prepare('UPDATE sectors SET name = ? WHERE id = ?');
    $stmt->execute([$name, $id]);
    jsonResponse(['success' => true]);
} elseif ($method === 'DELETE') {
    $id = $_GET['id'] ?? 0;
    
    if (!$id) jsonResponse(['error' => 'ID é obrigatório'], 400);

    // Soft delete to maintain history in movements and users
    $stmt = $pdo->prepare('UPDATE sectors SET active = 0 WHERE id = ?');
    $stmt->execute([$id]);
    jsonResponse(['success' => true]);
} else {
    jsonResponse(['error' => 'Método inválido'], 405);
}
?>
