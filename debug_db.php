<?php
require 'api/config.php';

try {
    $stmt = $pdo->query('SELECT id, email, password, active FROM users');
    $users = $stmt->fetchAll();
    echo json_encode($users, JSON_PRETTY_PRINT);
} catch (Exception $e) {
    echo "Error: " . $e->getMessage();
}
?>
