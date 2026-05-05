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
    $sector_id = $_GET['sector_id'] ?? '';
    
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
          AND s.is_internal = 1
    ";
    
    $params = [$start, $end];
    
    if ($action === 'ENTRADA' || $action === 'SAIDA') {
        $sql .= " AND m.action = ?";
        $params[] = $action;
    }

    if (!empty($sector_id)) {
        $sql .= " AND m.destination_sector_id = ?";
        $params[] = $sector_id;
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
          AND s.is_internal = 1
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
    // Usa responsible_sectors (many-to-many) para pegar o setor principal (primeiro setor vinculado)
    $stmt = $pdo->query("
        SELECT 
            r.id,
            r.name,
            COALESCE(
                (SELECT s2.name FROM responsible_sectors rs2 JOIN sectors s2 ON rs2.sector_id = s2.id WHERE rs2.responsible_id = r.id ORDER BY s2.id ASC LIMIT 1),
                'Sem setor'
            ) as sector_name,
            COUNT(p.process_id) as current_workload
        FROM responsibles r
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

} elseif ($type === 'auditor_processes') {
    // Lista de processos atualmente em posse de um auditor específico
    $responsible_id = (int)($_GET['responsible_id'] ?? 0);
    if (!$responsible_id) jsonResponse(['error' => 'responsible_id obrigatório'], 400);

    $stmt = $pdo->prepare("
        SELECT 
            p.process_number,
            p.subject,
            p.requester,
            m.movement_date as last_movement,
            s.name as current_sector,
            DATEDIFF(CURRENT_DATE, m.movement_date) as idle_days
        FROM movements m
        INNER JOIN (
            SELECT process_id, MAX(id) as max_id
            FROM movements
            GROUP BY process_id
        ) latest ON m.id = latest.max_id
        JOIN processes p ON m.process_id = p.id
        JOIN sectors s ON m.destination_sector_id = s.id
        WHERE m.action = 'ENTRADA'
          AND m.responsible_id = ?
        ORDER BY m.movement_date ASC
    ");
    $stmt->execute([$responsible_id]);
    jsonResponse($stmt->fetchAll());

} elseif ($type === 'sector_stats') {
    // Total de entradas e saídas por setor no período
    if (empty($start) || empty($end)) {
        jsonResponse(['error' => 'Datas de início e fim são obrigatórias'], 400);
    }
    
    $sql = "
        SELECT 
            s.id,
            s.name as sector_name,
            s.alias as sector_alias,
            COALESCE(entries.total, 0) as total_entries,
            COALESCE(exits.total, 0) as total_exits
        FROM sectors s
        LEFT JOIN (
            SELECT destination_sector_id, COUNT(*) as total
            FROM movements
            WHERE movement_date BETWEEN ? AND ?
            GROUP BY destination_sector_id
        ) entries ON s.id = entries.destination_sector_id
        LEFT JOIN (
            -- Conta saídas baseadas no setor da movimentação anterior
            SELECT m_prev.destination_sector_id, COUNT(*) as total
            FROM movements m_next
            JOIN movements m_prev ON m_next.process_id = m_prev.process_id
            WHERE m_next.movement_date BETWEEN ? AND ?
              AND m_prev.id = (
                  SELECT MAX(id) FROM movements m_aux 
                  WHERE m_aux.process_id = m_next.process_id AND m_aux.id < m_next.id
              )
            GROUP BY m_prev.destination_sector_id
        ) exits ON s.id = exits.destination_sector_id
        WHERE (s.active = 1 OR entries.total > 0 OR exits.total > 0)
          AND s.is_internal = 1
        ORDER BY (COALESCE(entries.total, 0) + COALESCE(exits.total, 0)) DESC, s.name ASC
    ";
    
    $stmt = $pdo->prepare($sql);
    $start_full = $start . ' 00:00:00';
    $end_full = $end . ' 23:59:59';
    
    $stmt->execute([$start_full, $end_full, $start_full, $end_full]);
    jsonResponse($stmt->fetchAll());

} else {
    jsonResponse(['error' => 'Tipo de relatório inválido'], 400);
}
?>
