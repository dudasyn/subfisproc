<?php
session_start();

// Hostinger Production Credentials
$db_host = 'localhost'; // Normalmente Hostinger usa localhost para o mesmo servidor
$db_user = 'u489835785_subfisuser';
$db_pass = 'tsuk4Sh12@';
$db_name = 'u489835785_subfisprocdb';

try {
    $pdo = new PDO("mysql:host=$db_host;dbname=$db_name;charset=utf8mb4", $db_user, $db_pass);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    $pdo->setAttribute(PDO::ATTR_DEFAULT_FETCH_MODE, PDO::FETCH_ASSOC);
} catch (PDOException $e) {
    // Em produção, evite mostrar detalhes do erro para seguranca
    http_response_code(500);
    header('Content-Type: application/json');
    echo json_encode(['error' => 'Database connection failed.']);
    exit;
}

// Utility function to enforce authentication
function checkAuth($allowedRoles = []) {
    if (!isset($_SESSION['user_id'])) {
        jsonResponse(['error' => 'Unauthorized'], 401);
    }
    
    if (!empty($allowedRoles) && !in_array($_SESSION['role'], $allowedRoles)) {
        jsonResponse(['error' => 'Forbidden'], 403);
    }
}

// Utility function to return JSON and exit
function jsonResponse($data, $statusCode = 200) {
    http_response_code($statusCode);
    header('Content-Type: application/json');
    echo json_encode($data);
    exit;
}
?>
