<?php
require 'config.php';
checkAuth();

header('Content-Type: application/json');

$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'GET') {
    $stmt = $pdo->query('
        SELECT u.id, u.cpf, u.name, u.email, u.role, u.sector_id, u.active, s.name as sector_name 
        FROM users u 
        LEFT JOIN sectors s ON u.sector_id = s.id 
        WHERE u.active = 1 
        ORDER BY u.name ASC
    ');
    jsonResponse($stmt->fetchAll());
} elseif ($method === 'POST') {
    checkAuth(['Admin', 'Gestor']);
    $data = json_decode(file_get_contents('php://input'), true);
    
    $cpf = trim($data['cpf'] ?? '');
    $name = trim($data['name'] ?? '');
    $email = trim($data['email'] ?? '');
    $password = $data['password'] ?? '';
    $role = $data['role'] ?? 'Secretaria';
    $sector_id = $data['sector_id'] ?? null;

    if (empty($cpf) || empty($name) || empty($email) || empty($password)) {
        jsonResponse(['error' => 'CPF, Nome, E-mail e Senha são obrigatórios'], 400);
    }
    
    $hashedPassword = password_hash($password, PASSWORD_DEFAULT);

    try {
        $stmt = $pdo->prepare('INSERT INTO users (cpf, name, email, password, role, sector_id) VALUES (?, ?, ?, ?, ?, ?)');
        $stmt->execute([$cpf, $name, $email, $hashedPassword, $role, $sector_id]);
        jsonResponse(['success' => true, 'id' => $pdo->lastInsertId()]);
    } catch (PDOException $e) {
        if ($e->getCode() == 23000) {
            jsonResponse(['error' => 'CPF ou E-mail já cadastrados'], 400);
        }
        jsonResponse(['error' => 'Erro interno ao cadastrar'], 500);
    }
} elseif ($method === 'PUT') {
    checkAuth(['Admin', 'Gestor']);
    $data = json_decode(file_get_contents('php://input'), true);
    
    $id = $data['id'] ?? 0;
    $cpf = trim($data['cpf'] ?? '');
    $name = trim($data['name'] ?? '');
    $email = trim($data['email'] ?? '');
    $role = $data['role'] ?? 'Secretaria';
    $sector_id = $data['sector_id'] ?? null;
    $password = $data['password'] ?? '';

    if (!$id || empty($cpf) || empty($name) || empty($email)) {
        jsonResponse(['error' => 'ID, CPF, Nome e E-mail são obrigatórios'], 400);
    }
    
    try {
        if (!empty($password)) {
            $hashedPassword = password_hash($password, PASSWORD_DEFAULT);
            $stmt = $pdo->prepare('UPDATE users SET cpf=?, name=?, email=?, password=?, role=?, sector_id=? WHERE id=?');
            $stmt->execute([$cpf, $name, $email, $hashedPassword, $role, $sector_id, $id]);
        } else {
            $stmt = $pdo->prepare('UPDATE users SET cpf=?, name=?, email=?, role=?, sector_id=? WHERE id=?');
            $stmt->execute([$cpf, $name, $email, $role, $sector_id, $id]);
        }
        jsonResponse(['success' => true]);
    } catch (PDOException $e) {
        if ($e->getCode() == 23000) {
            jsonResponse(['error' => 'CPF ou E-mail já estão em uso por outro usuário'], 400);
        }
        jsonResponse(['error' => 'Erro interno ao atualizar'], 500);
    }
} elseif ($method === 'DELETE') {
    checkAuth(['Admin', 'Gestor']);
    $id = $_GET['id'] ?? 0;
    
    if (!$id) jsonResponse(['error' => 'ID é obrigatório'], 400);
    if ($id == $_SESSION['user_id']) jsonResponse(['error' => 'Você não pode desativar a si mesmo'], 400);

    // Soft delete
    $stmt = $pdo->prepare('UPDATE users SET active = 0 WHERE id = ?');
    $stmt->execute([$id]);
    jsonResponse(['success' => true]);
} else {
    jsonResponse(['error' => 'Método inválido'], 405);
}
?>
