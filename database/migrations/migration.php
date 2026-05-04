<?php
require 'api/config.php';

try {
    $pdo->exec("ALTER TABLE sectors ADD COLUMN parent_id INT DEFAULT NULL AFTER id");
    $pdo->exec("ALTER TABLE sectors ADD CONSTRAINT fk_sectors_parent FOREIGN KEY (parent_id) REFERENCES sectors(id) ON DELETE SET NULL");
    echo "Migração executada com sucesso.\n";
} catch (PDOException $e) {
    if (strpos($e->getMessage(), 'Duplicate column name') !== false) {
        echo "A coluna parent_id já existe.\n";
    } else {
        echo "Erro na migração: " . $e->getMessage() . "\n";
    }
}
?>
