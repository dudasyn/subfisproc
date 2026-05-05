<?php
try {
    $pdo = new PDO("mysql:host=127.0.0.1;dbname=subfisproc;charset=utf8mb4", "root", "tsuk4Sh");
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

    echo "Reclassificando movimentações...\n";

    // 1. O que foi para setor EXTERNO é SAIDA
    $stmt1 = $pdo->exec("UPDATE movements m 
                         JOIN sectors s ON m.destination_sector_id = s.id 
                         SET m.action = 'SAIDA' 
                         WHERE s.is_internal = 0");
    
    // 2. O que foi para setor INTERNO é ENTRADA
    $stmt2 = $pdo->exec("UPDATE movements m 
                         JOIN sectors s ON m.destination_sector_id = s.id 
                         SET m.action = 'ENTRADA' 
                         WHERE s.is_internal = 1");

    echo "Concluído!\n";
    echo "Saídas detectadas: $stmt1\n";
    echo "Entradas detectadas: $stmt2\n";

} catch (Exception $e) {
    echo "Erro: " . $e->getMessage() . "\n";
}
