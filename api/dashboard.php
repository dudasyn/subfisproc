<?php
require 'config.php';
checkAuth(['Admin', 'Gestor']);

header('Content-Type: application/json');

$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'GET') {
    $stats = [];

    $count_sql = "
        SELECT 
            (SELECT COUNT(*) FROM movements WHERE action = 'ENTRADA') as entradas,
            (SELECT COUNT(*) FROM movements WHERE action = 'SAIDA') as saidas
    ";
    
    $counts = $pdo->query($count_sql)->fetch();
    $stats['entradas'] = $counts['entradas'] ?: 0;
    $stats['saidas'] = $counts['saidas'] ?: 0;
    
    $stats['total_processes'] = $pdo->query('SELECT COUNT(*) FROM processes')->fetchColumn();

    // $stmt = $pdo->query('SELECT COUNT(*) as count FROM users WHERE active = 1');
    // $stats['total_users'] = $stmt->fetch()['count'];

    // Recent activity (last 7 movements)
    $stmt = $pdo->query('
        SELECT m.id, p.process_number, m.action, m.movement_date, 
               p.parent_id,
               (SELECT COUNT(*) FROM processes WHERE parent_id = p.id) as attachments_count,
               s.name as destination_sector, u.name as user_name
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
