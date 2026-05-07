<?php
require 'config.php';
checkAuth(['Admin', 'Gestor']);

header('Content-Type: application/json');

$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'GET') {
    $stats = [];
    
    $start = isset($_GET['start']) && $_GET['start'] !== '' ? $_GET['start'] . ' 00:00:00' : null;
    $end = isset($_GET['end']) && $_GET['end'] !== '' ? $_GET['end'] . ' 23:59:59' : null;

    // Build date filter clause
    $date_filter = "";
    $params = [];
    if ($start && $end) {
        $date_filter = " AND movement_date BETWEEN :start AND :end ";
        $params[':start'] = $start;
        $params[':end'] = $end;
    }

    // 1. Fetch all sectors to build hierarchy
    $stmt = $pdo->query("SELECT id, parent_id FROM sectors");
    $all_sectors = $stmt->fetchAll(PDO::FETCH_ASSOC);

    function getDescendants($sectors, $parentId) {
        $descendants = [$parentId];
        $queue = [$parentId];
        while (!empty($queue)) {
            $current = array_shift($queue);
            foreach ($sectors as $s) {
                if ($s['parent_id'] == $current && !in_array($s['id'], $descendants)) {
                    $descendants[] = $s['id'];
                    $queue[] = $s['id'];
                }
            }
        }
        return $descendants;
    }

    $subfis_ids = getDescendants($all_sectors, 316);
    $aft_ids = getDescendants($all_sectors, 319);

    $subfis_in = implode(',', $subfis_ids);
    $aft_in = implode(',', $aft_ids);

    // 2. Compute CUSTÓDIA (processes currently stationed in these sectors, regardless of date)
    // Custodia relies on the LATEST movement for each process.
    $custodia_sql = "
        SELECT 
            SUM(CASE WHEN m.destination_sector_id IN ($subfis_in) THEN 1 ELSE 0 END) as subfis_carga,
            SUM(CASE WHEN m.destination_sector_id IN ($aft_in) THEN 1 ELSE 0 END) as aft_carga
        FROM processes p
        JOIN movements m ON p.id = m.process_id
        WHERE m.id = (
            SELECT MAX(id) FROM movements WHERE process_id = p.id
        )
    ";
    $custodia = $pdo->query($custodia_sql)->fetch(PDO::FETCH_ASSOC);
    $stats['subfis_carga'] = $custodia['subfis_carga'] ?: 0;
    $stats['aft_carga'] = $custodia['aft_carga'] ?: 0;

    // 3. Compute ENTRADAS in period
    $entradas_sql = "
        SELECT 
            SUM(CASE WHEN destination_sector_id IN ($subfis_in) THEN 1 ELSE 0 END) as subfis_entradas,
            SUM(CASE WHEN destination_sector_id IN ($aft_in) THEN 1 ELSE 0 END) as aft_entradas
        FROM movements
        WHERE action = 'ENTRADA' $date_filter
    ";
    $stmt_entradas = $pdo->prepare($entradas_sql);
    $stmt_entradas->execute($params);
    $entradas = $stmt_entradas->fetch(PDO::FETCH_ASSOC);
    $stats['subfis_entradas'] = $entradas['subfis_entradas'] ?: 0;
    $stats['aft_entradas'] = $entradas['aft_entradas'] ?: 0;

    // 4. Compute SAIDAS in period (action = SAIDA and user was in the group)
    // For simplicity, we count SAIDA actions where the destination is NOT in the same group
    $saidas_sql = "
        SELECT 
            SUM(CASE WHEN action = 'SAIDA' AND (destination_sector_id NOT IN ($subfis_in) OR destination_sector_id IS NULL) THEN 1 ELSE 0 END) as subfis_saidas,
            SUM(CASE WHEN action = 'SAIDA' AND (destination_sector_id NOT IN ($aft_in) OR destination_sector_id IS NULL) THEN 1 ELSE 0 END) as aft_saidas
        FROM movements
        WHERE 1=1 $date_filter
    ";
    // Actually, a safer way to count exits is checking if the movement is a SAIDA. 
    $stmt_saidas = $pdo->prepare($saidas_sql);
    $stmt_saidas->execute($params);
    $saidas = $stmt_saidas->fetch(PDO::FETCH_ASSOC);
    $stats['subfis_saidas'] = $saidas['subfis_saidas'] ?: 0;
    $stats['aft_saidas'] = $saidas['aft_saidas'] ?: 0;

    // 5. Compute TRAMITACOES (internal movements or any movement handled by group)
    $tramitacoes_sql = "
        SELECT 
            SUM(CASE WHEN destination_sector_id IN ($subfis_in) AND action != 'ENTRADA' THEN 1 ELSE 0 END) as subfis_tramitacoes,
            SUM(CASE WHEN destination_sector_id IN ($aft_in) AND action != 'ENTRADA' THEN 1 ELSE 0 END) as aft_tramitacoes
        FROM movements
        WHERE 1=1 $date_filter
    ";
    $stmt_tram = $pdo->prepare($tramitacoes_sql);
    $stmt_tram->execute($params);
    $tram = $stmt_tram->fetch(PDO::FETCH_ASSOC);
    $stats['subfis_tramitacoes'] = $tram['subfis_tramitacoes'] ?: 0;
    $stats['aft_tramitacoes'] = $tram['aft_tramitacoes'] ?: 0;

    // 6. Compute AUDITORES (responsibles active and linked to these sectors)
    $auditores_sql = "
        SELECT 
            r.id,
            rs.sector_id
        FROM responsibles r
        JOIN responsible_sectors rs ON r.id = rs.responsible_id
        WHERE r.active = 1
    ";
    $auditores_list = $pdo->query($auditores_sql)->fetchAll(PDO::FETCH_ASSOC);
    
    $subfis_aud = [];
    $aft_aud = [];
    foreach ($auditores_list as $a) {
        if (in_array($a['sector_id'], $subfis_ids)) $subfis_aud[] = $a['id'];
        if (in_array($a['sector_id'], $aft_ids)) $aft_aud[] = $a['id'];
    }
    $stats['subfis_auditores'] = count(array_unique($subfis_aud));
    $stats['aft_auditores'] = count(array_unique($aft_aud));

    // 7. Calculate Monthly Entradas for the Charts (last 3 years)
    $monthly_sql = "
        SELECT 
            YEAR(movement_date) as yr,
            MONTH(movement_date) as mo,
            SUM(CASE WHEN destination_sector_id IN ($subfis_in) THEN 1 ELSE 0 END) as count_subfis,
            SUM(CASE WHEN destination_sector_id IN ($aft_in) THEN 1 ELSE 0 END) as count_aft
        FROM movements
        WHERE action = 'ENTRADA' 
          AND movement_date IS NOT NULL 
          AND YEAR(movement_date) >= YEAR(CURDATE()) - 2
        GROUP BY yr, mo
        ORDER BY yr ASC, mo ASC
    ";
    $monthly_records = $pdo->query($monthly_sql)->fetchAll(PDO::FETCH_ASSOC);

    $monthly_subfis = [];
    $monthly_aft = [];
    
    foreach ($monthly_records as $rec) {
        $yr = $rec['yr'];
        $mo = (int)$rec['mo'] - 1; // 0-indexed for JS (0-11)
        
        if (!isset($monthly_subfis[$yr])) $monthly_subfis[$yr] = array_fill(0, 12, 0);
        if (!isset($monthly_aft[$yr])) $monthly_aft[$yr] = array_fill(0, 12, 0);
        
        $monthly_subfis[$yr][$mo] = (int)$rec['count_subfis'];
        $monthly_aft[$yr][$mo] = (int)$rec['count_aft'];
    }

    $stats['monthly_entradas_subfis'] = $monthly_subfis;
    $stats['monthly_entradas_aft'] = $monthly_aft;

    // 8. Recent activity (last 7 movements)
    $stmt = $pdo->query('
        SELECT m.id, p.process_number, m.action, m.movement_date, 
               p.parent_id,
               (SELECT COUNT(*) FROM processes WHERE parent_id = p.id) as attachments_count,
               s.name as destination_sector, u.name as user_name
        FROM movements m
        JOIN processes p ON m.process_id = p.id
        LEFT JOIN sectors s ON m.destination_sector_id = s.id
        JOIN users u ON m.user_id = u.id
        ORDER BY m.created_at DESC
        LIMIT 7
    ');
    $stats['recent_activity'] = $stmt->fetchAll(PDO::FETCH_ASSOC);

    jsonResponse($stats);
} else {
    jsonResponse(['error' => 'Método inválido'], 405);
}
?>
