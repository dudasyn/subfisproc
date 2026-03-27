<?php
require 'config.php';
checkAuth();

header('Content-Type: application/json');

$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'GET') {
    $stats = [];

    $count_sql = "
        SELECT 
            SUM(CASE WHEN m.action IN ('ENTRADA', 'REDISTRIBUIÇÃO') THEN 1 ELSE 0 END) as entradas,
            SUM(CASE WHEN m.action = 'SAIDA' THEN 1 ELSE 0 END) as saidas
        FROM movements m
        INNER JOIN (
            SELECT process_id, MAX(id) as max_id
            FROM movements
            GROUP BY process_id
        ) latest ON m.id = latest.max_id";
    
    $counts = $pdo->query($count_sql)->fetch();
    $stats['entradas'] = $counts['entradas'] ?: 0;
    $stats['saidas'] = $counts['saidas'] ?: 0;
    
    $stats['total_processes'] = $pdo->query('SELECT COUNT(*) FROM processes')->fetchColumn();

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
