<?php
require 'config.php';
checkAuth();

header('Content-Type: application/json');

$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'GET') {
    $stmt = $pdo->query('SELECT id, name, active, created_at FROM sectors WHERE active = 1 ORDER BY name ASC');
    jsonResponse($stmt->fetchAll());
} elseif ($method === 'POST') {
    checkAuth(['Admin', 'Gestor']); // Only Admin/Gestor can create sectors
    $data = json_decode(file_get_contents('php://input'), true);
    
    $name = trim($data['name'] ?? '');
    if (empty($name)) jsonResponse(['error' => 'Nome do setor é obrigatório'], 400);

    $stmt = $pdo->prepare('INSERT INTO sectors (name) VALUES (?)');
    $stmt->execute([$name]);
    jsonResponse(['id' => $pdo->lastInsertId(), 'name' => $name, 'active' => 1]);
} elseif ($method === 'PUT') {
    checkAuth(['Admin', 'Gestor']);
    $data = json_decode(file_get_contents('php://input'), true);
    
    $id = $data['id'] ?? 0;
    $name = trim($data['name'] ?? '');
    if (!$id || empty($name)) jsonResponse(['error' => 'ID e Nome são obrigatórios'], 400);

    $stmt = $pdo->prepare('UPDATE sectors SET name = ? WHERE id = ?');
    $stmt->execute([$name, $id]);
    jsonResponse(['success' => true]);
} elseif ($method === 'DELETE') {
    checkAuth(['Admin', 'Gestor']);
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
