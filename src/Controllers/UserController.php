<?php

namespace App\Controllers;

use App\Models\User;
use App\Utils\Response;

class UserController {
    private $userModel;

    public function __construct() {
        $this->userModel = new User();
    }

    public function index() {
        AuthController::checkAuth();
        $users = $this->userModel->getAllActive();
        Response::json($users);
    }

    public function store() {
        AuthController::checkAuth(['Admin', 'Gestor']);
        $data = json_decode(file_get_contents('php://input'), true);

        $cpf = trim($data['cpf'] ?? '');
        $name = trim($data['name'] ?? '');
        $email = trim($data['email'] ?? '');
        $password = $data['password'] ?? '';
        $role = $data['role'] ?? 'Assistente Operacional';
        $department = trim($data['department'] ?? '');
        $sector_id = $data['sector_id'] ?? null;

        if (empty($cpf) || empty($name)) {
            Response::error('CPF e Nome são obrigatórios', 400);
        }

        if (empty($email)) $email = $cpf . '@subfis.gov';

        if (empty($password)) {
            $cleanCpf = preg_replace('/\D/', '', $cpf);
            $password = substr($cleanCpf, -6);
        }

        $hashedPassword = password_hash($password, PASSWORD_DEFAULT);

        try {
            $id = $this->userModel->create([
                'cpf' => $cpf,
                'name' => $name,
                'email' => $email,
                'password' => $hashedPassword,
                'role' => $role,
                'department' => $department,
                'sector_id' => $sector_id
            ]);
            Response::json(['success' => true, 'id' => $id]);
        } catch (\PDOException $e) {
            if ($e->getCode() == 23000) {
                Response::error('CPF ou E-mail já cadastrados', 400);
            }
            Response::error('Erro interno ao cadastrar', 500);
        }
    }

    public function update() {
        AuthController::checkAuth(['Admin', 'Gestor']);
        $data = json_decode(file_get_contents('php://input'), true);
        
        $id = $data['id'] ?? 0;
        $cpf = trim($data['cpf'] ?? '');
        $name = trim($data['name'] ?? '');
        $email = trim($data['email'] ?? '');
        $role = $data['role'] ?? 'Assistente Operacional';
        $department = trim($data['department'] ?? '');
        $sector_id = $data['sector_id'] ?? null;
        $password = $data['password'] ?? '';

        if (!$id || empty($cpf) || empty($name) || empty($email)) {
            Response::error('ID, CPF, Nome e E-mail são obrigatórios', 400);
        }

        if (!empty($password)) {
            $data['password'] = password_hash($password, PASSWORD_DEFAULT);
        }

        try {
            $this->userModel->update($id, [
                'cpf' => $cpf,
                'name' => $name,
                'email' => $email,
                'password' => $data['password'] ?? null,
                'role' => $role,
                'department' => $department,
                'sector_id' => $sector_id
            ]);
            Response::json(['success' => true]);
        } catch (\PDOException $e) {
            if ($e->getCode() == 23000) {
                Response::error('CPF ou E-mail já estão em uso por outro usuário', 400);
            }
            Response::error('Erro interno ao atualizar', 500);
        }
    }

    public function destroy() {
        AuthController::checkAuth(['Admin', 'Gestor']);
        $id = $_GET['id'] ?? 0;
        
        if (!$id) Response::error('ID é obrigatório', 400);
        if ($id == $_SESSION['user_id']) Response::error('Você não pode desativar a si mesmo', 400);

        $this->userModel->softDelete($id);
        Response::json(['success' => true]);
    }

    public function resetPassword() {
        AuthController::checkAuth(['Admin', 'Gestor']);
        $data = json_decode(file_get_contents('php://input'), true);
        $userId = $data['user_id'] ?? 0;
        
        if (!$userId) Response::error('ID do usuário é obrigatório', 400);

        $user = $this->userModel->findById($userId);
        if (!$user) Response::error('Usuário não encontrado', 404);

        $cleanCpf = preg_replace('/\D/', '', $user['cpf']);
        $defaultPassword = substr($cleanCpf, -6);
        $hashed = password_hash($defaultPassword, PASSWORD_DEFAULT);

        $this->userModel->updatePassword($userId, $hashed, 1);
        Response::json(['success' => true]);
    }

    public function changePassword() {
        AuthController::checkAuth();
        $data = json_decode(file_get_contents('php://input'), true);
        
        $oldPass = $data['old_password'] ?? '';
        $newPass = $data['new_password'] ?? '';
        
        if (empty($newPass)) Response::error('Nova senha é obrigatória', 400);

        $user = $this->userModel->findById($_SESSION['user_id']);

        if ($user && password_verify($oldPass, $user['password'])) {
            $hashed = password_hash($newPass, PASSWORD_DEFAULT);
            $this->userModel->updatePassword($_SESSION['user_id'], $hashed, 0);
            $_SESSION['force_password_change'] = false;
            Response::json(['success' => true]);
        } else {
            Response::error('Senha atual incorreta', 401);
        }
    }
}
