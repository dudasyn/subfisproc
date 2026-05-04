<?php

namespace App\Controllers;

use App\Config\Database;
use App\Utils\Response;
use PDO;

class AuthController {
    public function login() {
        $data = json_decode(file_get_contents('php://input'), true);

        $username = trim($data['email'] ?? '');
        $password = $data['password'] ?? '';

        if (empty($username) || empty($password)) {
            Response::error('CPF/E-mail e senha são obrigatórios', 400);
        }

        $db = Database::getConnection();
        $stmt = $db->prepare('SELECT id, name, role, department, sector_id, password, force_password_change FROM users WHERE (email = ? OR cpf = ?) AND active = 1');
        $stmt->execute([$username, $username]);
        $user = $stmt->fetch();

        if ($user && password_verify($password, $user['password'])) {
            $_SESSION['user_id'] = $user['id'];
            $_SESSION['name'] = $user['name'];
            $_SESSION['role'] = $user['role'];
            $_SESSION['department'] = $user['department'];
            $_SESSION['sector_id'] = $user['sector_id'];
            $_SESSION['force_password_change'] = (bool)$user['force_password_change'];

            Response::json([
                'success' => true,
                'user' => [
                    'id' => $user['id'],
                    'name' => $user['name'],
                    'role' => $user['role'],
                    'department' => $user['department'],
                    'sector_id' => $user['sector_id'],
                    'force_password_change' => (bool)$user['force_password_change']
                ]
            ]);
        } else {
            Response::error('CPF/E-mail ou senha incorretos.', 401);
        }
    }

    public function logout() {
        session_destroy();
        Response::json(['success' => true]);
    }

    public function session() {
        if (isset($_SESSION['user_id'])) {
            Response::json([
                'authenticated' => true,
                'user' => [
                    'id' => $_SESSION['user_id'],
                    'name' => $_SESSION['name'],
                    'role' => $_SESSION['role'],
                    'department' => $_SESSION['department'] ?? '',
                    'sector_id' => $_SESSION['sector_id'],
                    'force_password_change' => $_SESSION['force_password_change'] ?? false
                ]
            ]);
        } else {
            Response::error('Não autenticado', 401);
        }
    }

    public static function checkAuth($allowedRoles = []) {
        if (!isset($_SESSION['user_id'])) {
            Response::error('Unauthorized', 401);
        }
        
        if (!empty($allowedRoles) && !in_array($_SESSION['role'], $allowedRoles)) {
            Response::error('Forbidden', 403);
        }
    }
}
