<?php
error_reporting(E_ALL);
ini_set('display_errors', 1);

$db_host = 'localhost';
$db_user = 'root';
$db_pass = '';
$db_name = 'subfisproc';

try {
    $pdo = new PDO("mysql:host=$db_host;dbname=$db_name;charset=utf8mb4", $db_user, $db_pass);
    echo "Connected successfully to localhost.\n";
} catch (PDOException $e) {
    echo "Failed with localhost: " . $e->getMessage() . "\n";
}

try {
    $pdo = new PDO("mysql:host=127.0.0.1;dbname=$db_name;charset=utf8mb4", $db_user, $db_pass);
    echo "Connected successfully to 127.0.0.1.\n";
} catch (PDOException $e) {
    echo "Failed with 127.0.0.1: " . $e->getMessage() . "\n";
}
?>
