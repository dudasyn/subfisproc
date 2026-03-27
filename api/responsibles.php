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
               GROUP_CONCAT(s.name ORDER BY s.name SEPARATOR ", ") as sector_name
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
    $stmt = $pdo->prepare('UPDATE responsibles SET active = 0 WHERE id = ?');
    $stmt->execute([$id]);
    jsonResponse(['success' => true]);
} else {
    jsonResponse(['error' => 'Método inválido'], 405);
}