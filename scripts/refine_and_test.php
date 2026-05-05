<?php
try {
    $pdo = new PDO("mysql:host=127.0.0.1;dbname=subfisproc;charset=utf8mb4", "root", "tsuk4Sh");
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

    // 1. Garantir que subsetores com nome "Auditoria" sejam Internos
    $pdo->exec("UPDATE sectors SET is_internal = 1 WHERE name LIKE 'Auditoria%' OR name LIKE '%Fiscalização%'");
    
    // 2. Re-classificar movimentações novamente com a lista atualizada
    $pdo->exec("UPDATE movements m JOIN sectors s ON m.destination_sector_id = s.id SET m.action = 'SAIDA' WHERE s.is_internal = 0");
    $pdo->exec("UPDATE movements m JOIN sectors s ON m.destination_sector_id = s.id SET m.action = 'ENTRADA' WHERE s.is_internal = 1");

    echo "Classificação de setores e movimentações refinada!\n";

    // 3. Testar o que o relatório retornaria para o período do print
    echo "\n--- TESTE RELATÓRIO (01/05 a 05/05) ---\n";
    $stmt = $pdo->query("SELECT action, COUNT(*) as total FROM movements WHERE movement_date BETWEEN '2026-05-01' AND '2026-05-05' GROUP BY action");
    while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
        echo "Ação: " . $row['action'] . " | Total: " . $row['total'] . "\n";
    }

} catch (Exception $e) {
    echo "Erro: " . $e->getMessage() . "\n";
}
