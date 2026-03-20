<?php
require 'config.php';
checkAuth(['Admin', 'Gestor']);

header('Content-Type: application/json');

$type = $_GET['type'] ?? '';
$start = $_GET['start'] ?? '';
$end = $_GET['end'] ?? '';

if ($type === 'movements') {
    if (empty($start) || empty($end)) {
        jsonResponse(['error' => 'Datas de início e fim são obrigatórias'], 400);
    }
    
    // Entradas e Saídas no período
    $action = $_GET['action'] ?? '';
    
    $sql = "
        SELECT 
            m.movement_date,
            m.action,
            p.process_number,
            p.subject,
            p.requester,
            s.name as destination_sector,
            u.name as user_name
        FROM movements m
        JOIN processes p ON m.process_id = p.id
        JOIN sectors s ON m.destination_sector_id = s.id
        JOIN users u ON m.user_id = u.id
        WHERE m.movement_date BETWEEN ? AND ?
    ";
    
    $params = [$start, $end];
    
    if ($action === 'ENTRADA' || $action === 'SAIDA') {
        $sql .= " AND m.action = ?";
        $params[] = $action;
    }
    
    $sql .= " ORDER BY m.movement_date DESC, m.created_at DESC";
    
    $stmt = $pdo->prepare($sql);
    $stmt->execute($params);
    jsonResponse($stmt->fetchAll());

} elseif ($type === 'stagnant') {
    // Processos parados (última movimentação foi há mais de 15 dias e a ação foi ENTRADA)
    // Ou seja, entrou na SUBFIS e não saiu ainda.
    $days = (int)($_GET['days'] ?? 15);
    
    $stmt = $pdo->prepare("
        SELECT 
            p.process_number,
            p.subject,
            p.requester,
            m_last.movement_date as last_movement,
            DATEDIFF(CURRENT_DATE, m_last.movement_date) as idle_days
        FROM processes p
        INNER JOIN (
            SELECT process_id, MAX(created_at) as max_created
            FROM movements
            GROUP BY process_id
        ) m_latest ON p.id = m_latest.process_id
        INNER JOIN movements m_last ON m_latest.process_id = m_last.process_id 
            AND m_latest.max_created = m_last.created_at
        WHERE m_last.action = 'ENTRADA' 
          AND DATEDIFF(CURRENT_DATE, m_last.movement_date) >= ?
        ORDER BY idle_days DESC
    ");
    $stmt->execute([$days]);
    jsonResponse($stmt->fetchAll());

} else {
    jsonResponse(['error' => 'Tipo de relatório inválido'], 400);
}
?>
