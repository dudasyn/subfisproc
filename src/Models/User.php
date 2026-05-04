<?php

namespace App\Models;

use App\Config\Database;
use PDO;

class User {
    private $db;

    public function __construct() {
        $this->db = Database::getConnection();
    }

    public function findByCpf($cpf) {
        $stmt = $this->db->prepare('SELECT * FROM users WHERE cpf = ?');
        $stmt->execute([$cpf]);
        return $stmt->fetch();
    }

    public function findById($id) {
        $stmt = $this->db->prepare('SELECT * FROM users WHERE id = ?');
        $stmt->execute([$id]);
        return $stmt->fetch();
    }

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

    public function update($id, $data) {
        if (!empty($data['password'])) {
            $stmt = $this->db->prepare('UPDATE users SET cpf=?, name=?, email=?, password=?, role=?, department=?, sector_id=? WHERE id=?');
            return $stmt->execute([
                $data['cpf'], $data['name'], $data['email'], $data['password'], 
                $data['role'], $data['department'], $data['sector_id'], $id
            ]);
        } else {
            $stmt = $this->db->prepare('UPDATE users SET cpf=?, name=?, email=?, role=?, department=?, sector_id=? WHERE id=?');
            return $stmt->execute([
                $data['cpf'], $data['name'], $data['email'], 
                $data['role'], $data['department'], $data['sector_id'], $id
            ]);
        }
    }

    public function updatePassword($id, $hashedPassword, $forceChange = 0) {
        $stmt = $this->db->prepare('UPDATE users SET password = ?, force_password_change = ? WHERE id = ?');
        return $stmt->execute([$hashedPassword, $forceChange, $id]);
    }

    public function softDelete($id) {
        $stmt = $this->db->prepare('UPDATE users SET active = 0 WHERE id = ?');
        return $stmt->execute([$id]);
    }
}
