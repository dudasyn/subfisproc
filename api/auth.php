<?php
require 'config.php';

header('Content-Type: application/json');

$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'POST') {
    $data = json_decode(file_get_contents('php://input'), true);
    
    // Action handler (Login or Logout)
    if (isset($data['action']) && $data['action'] === 'logout') {
        session_destroy();
        jsonResponse(['success' => true]);
    }

    $email = $data['email'] ?? '';
    $password = $data['password'] ?? '';

    if (empty($email) || empty($password)) {
        jsonResponse(['error' => 'E-mail e senha são obrigatórios'], 400);
    }

    $stmt = $pdo->prepare('SELECT id, name, role, sector_id, password FROM users WHERE email = ? AND active = 1');
    $stmt->execute([$email]);
    $user = $stmt->fetch();

    if ($user && password_verify($password, $user['password'])) {
        $_SESSION['user_id'] = $user['id'];
        $_SESSION['name'] = $user['name'];
        $_SESSION['role'] = $user['role'];
        $_SESSION['sector_id'] = $user['sector_id'];

        jsonResponse([
            'success' => true,
            'user' => [
                'id' => $user['id'],
                'name' => $user['name'],
                'role' => $user['role'],
                'sector_id' => $user['sector_id']
            ]
        ]);
    } else {
        jsonResponse(['error' => 'E-mail ou senha incorretos, ou usuário inativo.'], 401);
    }
} else if ($method === 'GET') {
    // Check if session is active
    if (isset($_SESSION['user_id'])) {
        jsonResponse([
            'authenticated' => true,
            'user' => [
                'id' => $_SESSION['user_id'],
                'name' => $_SESSION['name'],
                'role' => $_SESSION['role'],
                'sector_id' => $_SESSION['sector_id']
            ]
        ]);
    } else {
        jsonResponse(['authenticated' => false], 401);
    }
} else {
    jsonResponse(['error' => 'Method not allowed'], 405);
}
?>
