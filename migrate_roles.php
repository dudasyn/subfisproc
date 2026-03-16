<?php
require 'api/config.php';
try {
    // 1. Add force_password_change column if not exists
    $pdo->exec("ALTER TABLE users ADD COLUMN IF NOT EXISTS force_password_change BOOLEAN DEFAULT TRUE");
    echo "Coluna 'force_password_change' verificada/adicionada.\n";

    // 2. Update existing users with old roles
    $pdo->exec("UPDATE users SET role = 'Assistente Operacional' WHERE role IN ('Secretaria', 'Agente')");
    echo "Usuários existentes atualizados para 'Assistente Operacional'.\n";

    // 3. Modify the ENUM column
    $pdo->exec("ALTER TABLE users MODIFY COLUMN role ENUM('Admin', 'Gestor', 'Assistente Operacional', 'Estagiario') NOT NULL");
    echo "Coluna 'role' atualizada para novos valores ENUM.\n";
    
    echo "Migração concluída com sucesso!";
} catch(Exception $e) {
    echo "Erro na migração: " . $e->getMessage() . "\n";
}
