-- Script de Criação do Banco de Dados SUBFISPROC (Versão Hostinger)
-- Banco de Dados: u489835785_subfisprocdb

-- 1. Tabela de Setores
CREATE TABLE IF NOT EXISTS sectors (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Inserindo setor padrão SUBFIS
INSERT INTO sectors (name) SELECT 'SUBFIS' WHERE NOT EXISTS (SELECT 1 FROM sectors WHERE name = 'SUBFIS');

-- 2. Tabela de Usuários (Colaboradores / Admin)
CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    cpf VARCHAR(14) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    role ENUM('Admin', 'Gestor', 'Secretaria', 'Agente', 'Estagiario') NOT NULL,
    sector_id INT,
    active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (sector_id) REFERENCES sectors(id) ON DELETE SET NULL
);

-- Inserindo Usuário Admin Padrão
-- Senha: tsuk4Sh12@
INSERT INTO users (cpf, name, email, password, role, sector_id) 
SELECT '000.000.000-00', 'Administrador do Sistema', 'admin@subfis.gov', '$2y$12$LhnFJaOrIuaodl3oBnKXL.GyRhfzVTsyo.OA2MVX0X4Rkh6nxMOue', 'Admin', 1
WHERE NOT EXISTS (SELECT 1 FROM users WHERE email = 'admin@subfis.gov');

-- 3. Tabela de Processos
CREATE TABLE IF NOT EXISTS processes (
    id INT AUTO_INCREMENT PRIMARY KEY,
    process_number VARCHAR(50) UNIQUE NOT NULL,
    subject VARCHAR(255) NOT NULL,
    requester VARCHAR(255) NOT NULL,
    document_number VARCHAR(20),
    observations TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 4. Tabela de Movimentações
CREATE TABLE IF NOT EXISTS movements (
    id INT AUTO_INCREMENT PRIMARY KEY,
    process_id INT NOT NULL,
    movement_date DATE NOT NULL,
    action ENUM('ENTRADA', 'SAIDA') NOT NULL,
    destination_sector_id INT NOT NULL,
    user_id INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (process_id) REFERENCES processes(id) ON DELETE CASCADE,
    FOREIGN KEY (destination_sector_id) REFERENCES sectors(id),
    FOREIGN KEY (user_id) REFERENCES users(id)
);
