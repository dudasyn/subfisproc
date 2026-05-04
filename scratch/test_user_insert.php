<?php
require 'api/config.php';
try {
    $stmt = $pdo->prepare('INSERT INTO users (cpf, name, email, password, role, department, sector_id) VALUES (?, ?, ?, ?, ?, ?, ?)');
    $stmt->execute(['99999999999', 'Teste', 'teste@teste.com', '123456', 'Assistente Operacional', '', 1]);
    echo "Sucesso!";
    $pdo->exec('DELETE FROM users WHERE cpf = "99999999999"');
} catch (PDOException $e) {
    echo "Erro: " . $e->getMessage();
}
