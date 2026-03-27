<?php
require 'api/config.php';

function testFilter($label, $sector_id, $only_current, $search = '') {
    global $pdo;
    echo "Testing: $label (Sector: $sector_id, Current Only: ".($only_current?'Yes':'No').", Search: '$search')\n";
    
    $params = [];
    $sql = "SELECT DISTINCT p.id, p.process_number FROM processes p ";
    
    if ($only_current && $sector_id) {
        $sql .= "
            JOIN movements m ON p.id = m.process_id 
            WHERE m.id IN (SELECT MAX(id) FROM movements GROUP BY process_id)
            AND m.destination_sector_id = ?
        ";
        $params[] = $sector_id;
        if ($search) {
            $sql .= " AND p.process_number LIKE ?";
            $params[] = '%'.$search.'%';
        }
    } elseif ($sector_id) {
        $sql .= "
            JOIN movements m ON p.id = m.process_id 
            WHERE m.destination_sector_id = ?
        ";
        $params[] = $sector_id;
        if ($search) {
            $sql .= " AND p.process_number LIKE ?";
            $params[] = '%'.$search.'%';
        }
    } else {
        $sql .= " WHERE p.process_number LIKE ?";
        $params[] = '%'.$search.'%';
    }
    
    $stmt = $pdo->prepare($sql);
    $stmt->execute($params);
    $results = $stmt->fetchAll(PDO::FETCH_ASSOC);
    echo "Found " . count($results) . " processes.\n";
    foreach($results as $r) echo " - " . $r['process_number'] . "\n";
    echo "-------------------\n";
}

try {
    // Get a valid sector ID
    $sid = $pdo->query("SELECT id FROM sectors WHERE active = 1 LIMIT 1")->fetchColumn();
    if (!$sid) die("No active sectors found for test.\n");

    testFilter("PASSED THROUGH SECTOR", $sid, false);
    testFilter("CURRENTLY IN SECTOR", $sid, true);
    
} catch (Exception $e) {
    echo "Error: " . $e->getMessage();
}
