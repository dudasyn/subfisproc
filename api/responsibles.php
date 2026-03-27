<?php
require 'config.php';
checkAuth();

header('Content-Type: application/json');

$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'GET') {
    $stmt = $pdo->query('SELECT r.id, r.name, r.active, r.created_at, s.name as sector_name FROM responsibles r JOIN sectors s ON r.sector_id = s.id WHERE r.active = 1 ORDER BY r.name ASC');
    jsonResponse($stmt->fetchAll());
} elseif ($method === 'POST') {
    $data = json_decode(file_get_contents('php://input'), true);
    $name = trim($data['name'] ?? '');
    $sector_id = $data['sector_id'] ?? null;
    if (empty($name)) jsonResponse(['error' => 'Nome e obrigatorio'], 400);
    if (empty($sector_id)) jsonResponse(['error' => 'Setor e obrigatorio'], 400);
    $stmt = $pdo->prepare('INSERT INTO responsibles (name, sector_id) VALUES (?, ?)');
    $stmt->execute([$name, $sector_id]);
    jsonResponse(['id' => $pdo->lastInsertId(), 'name' => $name, 'sector_id' => $sector_id, 'active' => 1]);
} elseif ($method === 'PUT') {
    $data = json_decode(file_get_contents('php://input'), true);
    $id = $data['id'] ?? 0;
    $name = trim($data['name'] ?? '');
    $sector_id = $data['sector_id'] ?? null;
    if (!$id || empty($name)) jsonResponse(['error' => 'ID e Nome sao obrigatorios'], 400);
    $stmt = $pdo->prepare('UPDATE responsibles SET name = ?, sector_id = ? WHERE id = ?');
    $stmt->execute([$name, $sector_id, $id]);
    jsonResponse(['success' => true]);
} elseif ($method === 'DELETE') {
    $id = $_GET['id'] ?? 0;
    if (!$id) jsonResponse(['error' => 'ID e obrigatorio'], 400);
    $stmt = $pdo->prepare('UPDATE responsibles SET active = 0 WHERE id = ?');
    $stmt->execute([$id]);
    jsonResponse(['success' => true]);
} else {
    jsonResponse(['error' => 'Metodo invalido'], 405);
}