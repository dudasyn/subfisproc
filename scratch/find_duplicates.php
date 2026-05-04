<?php
require 'api/config.php';

echo "Verificando duplicidades de movimentações...\n";

// 1. Movimentações IDENTICAS (Mesmo processo, data, ação e setor)
$stmt = $pdo->query("
    SELECT process_id, movement_date, action, destination_sector_id, COUNT(*) as qty
    FROM movements
    GROUP BY process_id, movement_date, action, destination_sector_id
    HAVING qty > 1
    LIMIT 10
");
$identicals = $stmt->fetchAll(PDO::FETCH_ASSOC);

echo "\n--- Movimentações 100% IDÊNTICAS (Mesmo Processo, Data, Ação e Setor) ---\n";
if (empty($identicals)) {
    echo "Nenhuma duplicidade idêntica encontrada.\n";
} else {
    foreach ($identicals as $row) {
        echo "Processo ID: {$row['process_id']} | Data: {$row['movement_date']} | Ação: {$row['action']} | Qtd: {$row['qty']}\n";
    }
}

// 2. Movimentações SUSPEITAS (Mesmo processo, data e ação, mas SETORES DIFERENTES)
// Isso acontece muito quando um setor é 'SUBFIS' e outro é 'Subsecretaria de Fiscalização'
$stmt = $pdo->query("
    SELECT m.process_id, p.process_number, m.movement_date, m.action, COUNT(*) as qty, 
           GROUP_CONCAT(s.name SEPARATOR ' / ') as sectors
    FROM movements m
    JOIN processes p ON m.process_id = p.id
    JOIN sectors s ON m.destination_sector_id = s.id
    GROUP BY m.process_id, m.movement_date, m.action
    HAVING qty > 1
    ORDER BY qty DESC
    LIMIT 20
");
$suspects = $stmt->fetchAll(PDO::FETCH_ASSOC);

echo "\n--- Movimentações SUSPEITAS (Mesmo Processo/Data, mas Setores Diferentes) ---\n";
if (empty($suspects)) {
    echo "Nenhuma duplicidade suspeita encontrada.\n";
} else {
    echo "Total de grupos suspeitos encontrados: " . count($suspects) . " (mostrando top 20)\n";
    foreach ($suspects as $row) {
        echo "Processo: {$row['process_number']} | Data: {$row['movement_date']} | Ação: {$row['action']} | Qtd: {$row['qty']} | Setores: {$row['sectors']}\n";
    }
}

// 3. Verificação específica para os setores SUBFIS (IDs 1 e 2)
$stmt = $pdo->query("
    SELECT COUNT(*) 
    FROM movements m1
    JOIN movements m2 ON m1.process_id = m2.process_id 
       AND m1.movement_date = m2.movement_date 
       AND m1.id < m2.id
    WHERE m1.destination_sector_id IN (1, 2, 647) 
      AND m2.destination_sector_id IN (1, 2, 647)
");
$cross_dups = $stmt->fetchColumn();

echo "\n--- Conflitos entre SUBFIS (ID 1/2) e Subsecretaria (ID 647) ---\n";
echo "Total de registros que existem 'em dobro' entre esses setores: $cross_dups\n";
