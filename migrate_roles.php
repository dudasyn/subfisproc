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
    // 4. Disable force password change for the main admin
    $pdo->exec("UPDATE users SET force_password_change = 0 WHERE email = 'admin@subfis.gov'");
    echo "Troca de senha obrigatória desativada para o Admin principal.\n";
    
    echo "Migração concluída com sucesso!";
} catch(Exception $e) {
    echo "Erro na migração: " . $e->getMessage() . "\n";
}
