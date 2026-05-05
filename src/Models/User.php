<?php

namespace App\Models;

use App\Config\Database;
use PDO;

/**
 * Model de Usuário.
 * Encapsula todas as operações de persistência relacionadas aos servidores/usuários do sistema.
 */
class User {
    /** @var PDO Conexão com o banco de dados */
    private $db;

    public function __construct() {
        $this->db = Database::getConnection();
    }

    /**
     * Busca um usuário pelo CPF exato.
     */
    public function findByCpf($cpf) {
        $stmt = $this->db->prepare('SELECT * FROM users WHERE cpf = ?');
        $stmt->execute([$cpf]);
        return $stmt->fetch();
    }

    /**
     * Busca um usuário pelo ID primário.
     */
    public function findById($id) {
        $stmt = $this->db->prepare('SELECT * FROM users WHERE id = ?');
        $stmt->execute([$id]);
        return $stmt->fetch();
    }

    /**
     * Retorna todos os usuários com status 'Ativo', incluindo o nome do setor.
     */
    public function getAllActive() {
        $stmt = $this->db->query('
            SELECT u.id, u.cpf, u.name, u.email, u.role, u.department, u.sector_id, u.active, s.name as sector_name 
            FROM users u 
            LEFT JOIN sectors s ON u.sector_id = s.id 
            WHERE u.active = 1 
            ORDER BY u.name ASC
        ');
        return $stmt->fetchAll();
    }

    /**
     * Insere um novo usuário e força a troca de senha no primeiro login.
     */
    public function create($data) {
        $stmt = $this->db->prepare('INSERT INTO users (cpf, name, email, password, role, department, sector_id, force_password_change) VALUES (?, ?, ?, ?, ?, ?, ?, 1)');
        $stmt->execute([
            $data['cpf'], 
            $data['name'], 
            $data['email'], 
            $data['password'], 
            $data['role'], 
            $data['department'], 
            $data['sector_id']
        ]);
        return $this->db->lastInsertId();
    }

    /**
     * Atualiza dados cadastrais. Trata a atualização de senha de forma condicional.
     */
    public function update($id, $data) {
        if (!empty($data['password'])) {
            // Caso uma nova senha tenha sido informada
            $stmt = $this->db->prepare('UPDATE users SET cpf=?, name=?, email=?, password=?, role=?, department=?, sector_id=? WHERE id=?');
            return $stmt->execute([
                $data['cpf'], $data['name'], $data['email'], $data['password'], 
                $data['role'], $data['department'], $data['sector_id'], $id
            ]);
        } else {
            // Atualização sem mexer na senha atual
            $stmt = $this->db->prepare('UPDATE users SET cpf=?, name=?, email=?, role=?, department=?, sector_id=? WHERE id=?');
            return $stmt->execute([
                $data['cpf'], $data['name'], $data['email'], 
                $data['role'], $data['department'], $data['sector_id'], $id
            ]);
        }
    }

    /**
     * Atualiza especificamente a senha e o estado da flag de troca obrigatória.
     */
    public function updatePassword($id, $hashedPassword, $forceChange = 0) {
        $stmt = $this->db->prepare('UPDATE users SET password = ?, force_password_change = ? WHERE id = ?');
        return $stmt->execute([$hashedPassword, $forceChange, $id]);
    }

    /**
     * Desativa o usuário (Soft Delete) para manter integridade referencial em históricos.
     */
    public function softDelete($id) {
        $stmt = $this->db->prepare('UPDATE users SET active = 0 WHERE id = ?');
        return $stmt->execute([$id]);
    }
}
