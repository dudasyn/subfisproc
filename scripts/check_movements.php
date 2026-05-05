<?php
try {
    $pdo = new PDO("mysql:host=127.0.0.1;dbname=subfisproc;charset=utf8mb4", "root", "tsuk4Sh");
    
    echo "--- TOTAIS DE MOVIMENTAÇÕES ---\n";
    $stmt = $pdo->query("SELECT action, COUNT(*) as total FROM movements GROUP BY action");
    while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
        echo "Ação: " . $row['action'] . " | Total: " . $row['total'] . "\n";
    }

    echo "\n--- ÚLTIMAS 5 SAÍDAS ---\n";
    $stmt = $pdo->query("SELECT p.process_number, m.action, m.movement_date, s.name as sector 
                         FROM movements m 
                         JOIN processes p ON m.process_id = p.id 
                         JOIN sectors s ON m.destination_sector_id = s.id 
                         WHERE m.action LIKE '%SAI%' LIMIT 5");
    while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
        echo $row['process_number'] . " | " . $row['action'] . " | " . $row['movement_date'] . " | " . $row['sector'] . "\n";
    }

} catch (Exception $e) {
    echo "Erro: " . $e->getMessage() . "\n";
}
