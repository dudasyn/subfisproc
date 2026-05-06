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
    $stats['total_responsibles'] = $pdo->query('SELECT COUNT(*) FROM responsibles WHERE active = 1')->fetchColumn();
    $stats['total_sectors'] = $pdo->query('SELECT COUNT(*) FROM sectors WHERE active = 1')->fetchColumn();

    // Yearly statistics (for comparison chart)
    $yearly_stats_sql = "
        SELECT 
            y.year,
            COALESCE(m.entradas, 0) as entradas,
            COALESCE(m.saidas, 0) as saidas,
            COALESCE(p.total_processes, 0) as processos
        FROM (
            SELECT DISTINCT YEAR(movement_date) as year FROM movements WHERE movement_date IS NOT NULL
            UNION
            SELECT DISTINCT YEAR(created_at) as year FROM processes WHERE created_at IS NOT NULL
        ) y
        LEFT JOIN (
            SELECT 
                YEAR(movement_date) as year,
                SUM(CASE WHEN action = 'ENTRADA' THEN 1 ELSE 0 END) as entradas,
                SUM(CASE WHEN action = 'SAIDA' THEN 1 ELSE 0 END) as saidas
            FROM movements
            GROUP BY YEAR(movement_date)
        ) m ON y.year = m.year
        LEFT JOIN (
            SELECT 
                YEAR(created_at) as year,
                COUNT(*) as total_processes
            FROM processes
            GROUP BY YEAR(created_at)
        ) p ON y.year = p.year
        WHERE y.year IS NOT NULL AND y.year > 0
        ORDER BY y.year ASC
    ";
    $stats['yearly_stats'] = $pdo->query($yearly_stats_sql)->fetchAll();

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
