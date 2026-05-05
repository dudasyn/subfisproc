<?php

namespace App\Controllers;

use App\Config\Database;
use App\Utils\Response;
use PDO;

/**
 * Controlador responsável por gerenciar o ciclo de vida da autenticação do usuário.
 * Lida com login, logout e verificação de estado de sessão.
 */
class AuthController {
    /**
     * Autentica o usuário via CPF/E-mail e senha.
     * 
     * @return void Envia resposta JSON com dados do usuário ou erro.
     */
    public function login() {
        // Obtém dados do corpo da requisição JSON
        $data = json_decode(file_get_contents('php://input'), true);

        $username = trim($data['email'] ?? '');
        $password = $data['password'] ?? '';

        if (empty($username) || empty($password)) {
            Response::error('CPF/E-mail e senha são obrigatórios', 400);
        }

        $db = Database::getConnection();
        
        // Busca usuário permitindo login por CPF ou E-mail (flexibilidade para o usuário)
        $stmt = $db->prepare('SELECT id, name, role, department, sector_id, password, force_password_change FROM users WHERE (email = ? OR cpf = ?) AND active = 1');
        $stmt->execute([$username, $username]);
        $user = $stmt->fetch();

        // Validação de hash de senha segura
        if ($user && password_verify($password, $user['password'])) {
            // Registra dados essenciais na sessão PHP nativa
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

    /**
     * Encerra a sessão atual do usuário.
     */
    public function logout() {
        session_destroy();
        Response::json(['success' => true]);
    }

    /**
     * Retorna os dados do usuário se houver uma sessão ativa.
     * Utilizado pelo Frontend para manter o estado do usuário após Refresh.
     */
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

    /**
     * Middleware estático para verificação de permissões em outros controllers.
     * 
     * @param array $allowedRoles Lista de papéis (roles) que possuem acesso ao recurso.
     */
    public static function checkAuth($allowedRoles = []) {
        if (!isset($_SESSION['user_id'])) {
            Response::error('Unauthorized', 401);
        }
        
        // Verifica se o papel do usuário está na lista de permissões (RBAC simplificado)
        if (!empty($allowedRoles) && !in_array($_SESSION['role'], $allowedRoles)) {
            Response::error('Forbidden', 403);
        }
    }
}
