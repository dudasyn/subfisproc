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
    print_r($stmt->fetchAll());
} catch (PDOException $e) {
    echo "Erro: " . $e->getMessage();
}
