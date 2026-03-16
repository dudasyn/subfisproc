<?php
require 'api/config.php';
try {
    // 1. Update existing users with old roles
    $pdo->exec("UPDATE users SET role = 'Assistente Operacional' WHERE role IN ('Secretaria', 'Agente')");
    echo "Usuários existentes atualizados para 'Assistente Operacional'.\n";

    // 2. Modify the ENUM column
    $pdo->exec("ALTER TABLE users MODIFY COLUMN role ENUM('Admin', 'Gestor', 'Assistente Operacional', 'Estagiario') NOT NULL");
    echo "Coluna 'role' atualizada para novos valores ENUM.\n";
} catch(Exception $e) {
    echo "Erro ao migrar cargos: " . $e->getMessage() . "\n";
}
