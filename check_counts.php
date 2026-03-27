<?php
require 'api/config.php';
try {
    $stmt = $pdo->query('SELECT action, COUNT(*) as count FROM movements GROUP BY action');
    $results = $stmt->fetchAll(PDO::FETCH_ASSOC);
    echo json_encode($results, JSON_PRETTY_PRINT);
} catch (Exception $e) {
    echo "Error: " . $e->getMessage();
}
