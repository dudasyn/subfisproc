<?php
require 'api/config.php';
try {
    $pdo->exec("ALTER TABLE users MODIFY COLUMN role ENUM('Admin', 'Gestor', 'Secretaria', 'Agente', 'Estagiario', 'Assistente Operacional') NOT NULL");
    echo "Coluna 'role' atualizada com sucesso!\n";
} catch (PDOException $e) {
    echo "Erro: " . $e->getMessage() . "\n";
}
