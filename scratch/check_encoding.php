<?php
require 'api/config.php';
$stmt = $pdo->query('SELECT * FROM users');
while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
    foreach ($row as $key => $value) {
        if (!mb_check_encoding($value, 'UTF-8')) {
            echo "Erro de encoding na coluna '$key' do usuário ID " . $row['id'] . ": " . bin2hex($value) . "\n";
        }
    }
}
echo "Checagem concluída.\n";
