<?php
require 'api/config.php';
try {
    $stmt = $pdo->query('
        SELECT u.id, u.cpf, u.name, u.email, u.role, u.department, u.sector_id, u.active, s.name as sector_name 
        FROM users u 
        LEFT JOIN sectors s ON u.sector_id = s.id 
        WHERE u.active = 1 
        ORDER BY u.name ASC
    ');
    $data = $stmt->fetchAll();
    $json = json_encode($data);
    if ($json === false) {
        echo "JSON Encode falhou! Erro: " . json_last_error_msg() . "\n";
    } else {
        echo "JSON Encode funcionou. Tamanho: " . strlen($json) . " bytes\n";
    }
} catch (Exception $e) {
    echo "Erro: " . $e->getMessage();
}
