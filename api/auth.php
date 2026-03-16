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

    $username = trim($data['email'] ?? ''); // Accepts email or CPF
    $password = $data['password'] ?? '';

    if (empty($username) || empty($password)) {
        jsonResponse(['error' => 'CPF/E-mail e senha são obrigatórios'], 400);
    }

    $stmt = $pdo->prepare('SELECT id, name, role, sector_id, password, force_password_change FROM users WHERE (email = ? OR cpf = ?) AND active = 1');
    $stmt->execute([$username, $username]);
    $user = $stmt->fetch();

    if ($user && password_verify($password, $user['password'])) {
        $_SESSION['user_id'] = $user['id'];
        $_SESSION['name'] = $user['name'];
        $_SESSION['role'] = $user['role'];
        $_SESSION['sector_id'] = $user['sector_id'];
        $_SESSION['force_password_change'] = (bool)$user['force_password_change'];

        jsonResponse([
            'success' => true,
            'user' => [
                'id' => $user['id'],
                'name' => $user['name'],
                'role' => $user['role'],
                'sector_id' => $user['sector_id'],
                'force_password_change' => (bool)$user['force_password_change']
            ]
        ]);
    } else {
        jsonResponse(['error' => 'CPF/E-mail ou senha incorretos.'], 401);
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
                'sector_id' => $_SESSION['sector_id'],
                'force_password_change' => $_SESSION['force_password_change'] ?? false
            ]
        ]);
    } else {
        jsonResponse(['authenticated' => false], 401);
    }
} else {
    jsonResponse(['error' => 'Method not allowed'], 405);
}
?>
