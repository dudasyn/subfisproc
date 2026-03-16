<?php
require 'config.php';
checkAuth();

header('Content-Type: application/json');

$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'GET') {
    $stats = [];

    $stmt = $pdo->query('SELECT COUNT(*) as count FROM movements WHERE action = "ENTRADA"');
    $stats['entradas'] = $stmt->fetch()['count'];

    $stmt = $pdo->query('SELECT COUNT(*) as count FROM movements WHERE action = "SAIDA"');
    $stats['saidas'] = $stmt->fetch()['count'];

    $stmt = $pdo->query('SELECT COUNT(*) as count FROM processes');
    $stats['total_processes'] = $stmt->fetch()['count'];

    // $stmt = $pdo->query('SELECT COUNT(*) as count FROM users WHERE active = 1');
    // $stats['total_users'] = $stmt->fetch()['count'];

    // Recent activity (last 7 movements)
    $stmt = $pdo->query('
        SELECT m.id, p.process_number, m.action, m.movement_date, s.name as destination_sector, u.name as user_name
        FROM movements m
        JOIN processes p ON m.process_id = p.id
        JOIN sectors s ON m.destination_sector_id = s.id
        JOIN users u ON m.user_id = u.id
        ORDER BY m.created_at DESC
        LIMIT 7
    ');
    $stats['recent_activity'] = $stmt->fetchAll();

    jsonResponse($stats);
} else {
    jsonResponse(['error' => 'Método inválido'], 405);
}
?>
