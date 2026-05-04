<?php
require 'api/config.php';
$stmt = $pdo->query('DESCRIBE users');
print_r($stmt->fetchAll());
$stmt = $pdo->query('DESCRIBE sectors');
print_r($stmt->fetchAll());
