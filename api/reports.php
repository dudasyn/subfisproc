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
            p.parent_id,
            (SELECT COUNT(*) FROM processes WHERE parent_id = p.id) as attachments_count,
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
    $days = (int)($_GET['days'] ?? 15);
    $sector_id = $_GET['sector_id'] ?? null;
    
    $sql = "
        SELECT 
            p.process_number,
            p.subject,
            p.requester,
            p.parent_id,
            (SELECT COUNT(*) FROM processes WHERE parent_id = p.id) as attachments_count,
            m_last.movement_date as last_movement,
            s.name as current_sector,
            r.name as responsible_name,
            DATEDIFF(CURRENT_DATE, m_last.movement_date) as idle_days
        FROM processes p
        INNER JOIN (
            SELECT process_id, MAX(id) as max_id
            FROM movements
            GROUP BY process_id
        ) m_latest ON p.id = m_latest.process_id
        INNER JOIN movements m_last ON m_latest.max_id = m_last.id 
        JOIN sectors s ON m_last.destination_sector_id = s.id
        LEFT JOIN responsibles r ON m_last.responsible_id = r.id
        WHERE m_last.action = 'ENTRADA' 
          AND DATEDIFF(CURRENT_DATE, m_last.movement_date) >= ?
    ";
    
    $params = [$days];
    
    if ($sector_id) {
        $sql .= " AND m_last.destination_sector_id = ?";
        $params[] = $sector_id;
    }
    
    $sql .= " ORDER BY idle_days DESC";
    
    $stmt = $pdo->prepare($sql);
    $stmt->execute($params);
    jsonResponse($stmt->fetchAll());

} elseif ($type === 'auditors') {
    // Estatísticas de carga de trabalho por auditor
    // Conta processos onde a última movimentação foi ENTRADA para o auditor
    $stmt = $pdo->query("
        SELECT 
            r.id,
            r.name,
            s.name as sector_name,
            COUNT(p.process_id) as current_workload
        FROM responsibles r
        JOIN sectors s ON r.sector_id = s.id
        LEFT JOIN (
            SELECT m.responsible_id, m.process_id
            FROM movements m
            INNER JOIN (
                SELECT process_id, MAX(id) as max_id
                FROM movements
                GROUP BY process_id
            ) latest ON m.id = latest.max_id
            WHERE m.action = 'ENTRADA' AND m.responsible_id IS NOT NULL
        ) p ON r.id = p.responsible_id
        WHERE r.active = 1
        GROUP BY r.id
        ORDER BY current_workload DESC, r.name ASC
    ");
    jsonResponse($stmt->fetchAll());

} else {
    jsonResponse(['error' => 'Tipo de relatório inválido'], 400);
}
?>
