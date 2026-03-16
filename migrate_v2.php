<?php
require 'api/config.php';
try {
    $pdo->exec("ALTER TABLE users ADD COLUMN force_password_change BOOLEAN DEFAULT TRUE AFTER active");
    echo "Sucesso ao adicionar coluna force_password_change\n";
    
    // Update existing admin to not require password change
    $pdo->exec("UPDATE users SET force_password_change = 0 WHERE email = 'admin@subfis.gov'");
    echo "Admin configurado para não exigir troca de senha imediata\n";
} catch(Exception $e) {
    echo "Erro ou Coluna já existe: " . $e->getMessage() . "\n";
}
