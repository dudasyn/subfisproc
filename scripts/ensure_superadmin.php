<?php
/**
 * Script Administrativo: Garantia do Usuário Superadmin
 * 
 * Este script purga todos os usuários remanescentes (mantendo a integridade referencial)
 * e garante a existência exclusiva do usuário 'superadmin' com senha 'admin123@#'
 * e perfil de administrador global (sem setor associado).
 */

// Registra o autoloader PSR-4 nativo do projeto
spl_autoload_register(function ($class) {
    $prefix = 'App\\';
    $base_dir = __DIR__ . '/../src/';

    $len = strlen($prefix);
    if (strncmp($prefix, $class, $len) !== 0) {
        return;
    }

    $relative_class = substr($class, $len);
    $file = $base_dir . str_replace('\\', '/', $relative_class) . '.php';

    if (file_exists($file)) {
        require_once $file;
    }
});

use App\Config\Database;

try {
    echo "Conectando ao banco de dados...\n";
    $db = Database::getConnection();

    echo "Desabilitando validações de chaves estrangeiras...\n";
    $db->exec('SET FOREIGN_KEY_CHECKS = 0');

    echo "Limpando tabela de usuários cadastrados...\n";
    $db->exec('DELETE FROM users');

    echo "Criando usuário superadmin master...\n";
    $superadminPassword = password_hash('admin123@#', PASSWORD_DEFAULT);
    
    $stmt = $db->prepare('
        INSERT INTO users (cpf, name, email, password, role, department, sector_id, active, force_password_change) 
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    ');
    
    $stmt->execute([
        '000.000.000-00', 
        'Superadmin', 
        'superadmin', 
        $superadminPassword, 
        'Admin', 
        'ADMINISTRACAO', 
        null, 
        1, 
        0
    ]);

    echo "Reabilitando chaves estrangeiras...\n";
    $db->exec('SET FOREIGN_KEY_CHECKS = 1');

    echo "\n=== SUCESSO ===\n";
    echo "Usuário 'superadmin' cadastrado com sucesso!\n";
    echo "CPF/Login: superadmin\n";
    echo "Senha: admin123@#\n";
    echo "Setor: Nenhum (Acesso Global)\n";

} catch (\Exception $e) {
    echo "ERRO: " . $e->getMessage() . "\n";
    exit(1);
}
