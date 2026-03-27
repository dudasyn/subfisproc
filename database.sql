-- Script de Criação do Banco de Dados SUBFISPROC
CREATE DATABASE IF NOT EXISTS subfisproc CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE subfisproc;

-- 1. Tabela de Setores
CREATE TABLE IF NOT EXISTS sectors (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    active BOOLEAN DEFAULT TRUE,
    import_batch VARCHAR(50) DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Inserindo setor padrão SUBFIS e outros setores básicos
INSERT INTO sectors (name) VALUES ('SUBFIS');

-- 2. Tabela de Responsáveis (Auditores, etc)
CREATE TABLE IF NOT EXISTS responsibles (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    sector_id INT NOT NULL,
    active BOOLEAN DEFAULT TRUE,
    import_batch VARCHAR(50) DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (sector_id) REFERENCES sectors(id)
);

-- 2. Tabela de Usuários (Colaboradores / Admin)
-- Roles: Admin, Gestor, Secretaria, Agente, Estagiario
CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    cpf VARCHAR(14) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    role ENUM('Admin', 'Gestor', 'Secretaria', 'Agente', 'Estagiario') NOT NULL,
    sector_id INT,
    active BOOLEAN DEFAULT TRUE,
    force_password_change BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (sector_id) REFERENCES sectors(id) ON DELETE SET NULL
);

-- Inserindo Usuário Admin Padrão
-- A senha 'tsuk4Sh12@' convertida via password_hash() no PHP dá o valor abaixo (usando BCRYPT)
-- Isso permite o primeiro login. Como a gerou localmente, você poderá trocar dps.
INSERT INTO users (cpf, name, email, password, role, sector_id) 
VALUES (
    '000.000.000-00', 
    'Administrador do Sistema', 
    'admin@subfis.gov', 
    '$2y$12$LhnFJaOrIuaodl3oBnKXL.GyRhfzVTsyo.OA2MVX0X4Rkh6nxMOue', -- tsuk4Sh12@
    'Admin', 
    1
);

-- 3. Tabela de Processos
CREATE TABLE IF NOT EXISTS processes (
    id INT AUTO_INCREMENT PRIMARY KEY,
    process_number VARCHAR(255) UNIQUE NOT NULL,
    subject VARCHAR(255) NOT NULL,
    requester VARCHAR(255) NOT NULL,
    document_number VARCHAR(20), -- CPF ou CNPJ
    observations TEXT,
    import_batch VARCHAR(50) DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 4. Tabela de Movimentações
CREATE TABLE IF NOT EXISTS movements (
    id INT AUTO_INCREMENT PRIMARY KEY,
    process_id INT NOT NULL,
    movement_date DATE NOT NULL,
    action ENUM('ENTRADA', 'SAIDA', 'REDISTRIBUIÇÃO') NOT NULL,
    destination_sector_id INT NOT NULL,
    responsible_id INT,
    user_id INT NOT NULL,
    import_batch VARCHAR(50) DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (process_id) REFERENCES processes(id) ON DELETE CASCADE,
    FOREIGN KEY (destination_sector_id) REFERENCES sectors(id),
    FOREIGN KEY (responsible_id) REFERENCES responsibles(id),
    FOREIGN KEY (user_id) REFERENCES users(id)
);
