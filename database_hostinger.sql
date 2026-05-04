-- ================================================
-- SUBFISPROC - Schema Completo para Hostinger
-- Versão: 2.0 (many-to-many responsibles/sectors)
-- Importe este arquivo dentro do banco já criado no painel da Hostinger.
-- ================================================

SET FOREIGN_KEY_CHECKS = 0;

-- 1. Tabela de Setores
CREATE TABLE IF NOT EXISTS sectors (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    active BOOLEAN DEFAULT TRUE,
    import_batch VARCHAR(50) DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Setor padrão SUBFIS
INSERT INTO sectors (name)
SELECT 'SUBFIS' WHERE NOT EXISTS (SELECT 1 FROM sectors WHERE name = 'SUBFIS');

-- 2. Tabela de Responsáveis (Auditores, etc) — sem sector_id direto
CREATE TABLE IF NOT EXISTS responsibles (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    active BOOLEAN DEFAULT TRUE,
    import_batch VARCHAR(50) DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 3. Tabela de Relação Responsável <-> Setores (muitos para muitos)
CREATE TABLE IF NOT EXISTS responsible_sectors (
    responsible_id INT NOT NULL,
    sector_id INT NOT NULL,
    PRIMARY KEY (responsible_id, sector_id),
    INDEX (responsible_id),
    INDEX (sector_id),
    FOREIGN KEY (responsible_id) REFERENCES responsibles(id) ON DELETE CASCADE,
    FOREIGN KEY (sector_id) REFERENCES sectors(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 4. Tabela de Usuários (Colaboradores / Admin)
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
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Usuário Admin Padrão — Senha inicial: tsuk4Sh12@
INSERT INTO users (cpf, name, email, password, role, sector_id, force_password_change)
SELECT '000.000.000-00', 'Administrador do Sistema', 'admin@subfis.gov',
       '$2y$12$LhnFJaOrIuaodl3oBnKXL.GyRhfzVTsyo.OA2MVX0X4Rkh6nxMOue',
       'Admin', 1, 0
WHERE NOT EXISTS (SELECT 1 FROM users WHERE email = 'admin@subfis.gov');

-- 5. Tabela de Processos
CREATE TABLE IF NOT EXISTS processes (
    id INT AUTO_INCREMENT PRIMARY KEY,
    process_number VARCHAR(255) UNIQUE NOT NULL,
    subject VARCHAR(255) NOT NULL,
    requester VARCHAR(255) NOT NULL,
    document_number VARCHAR(20),
    observations TEXT,
    import_batch VARCHAR(50) DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 6. Tabela de Movimentações
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
    FOREIGN KEY (responsible_id) REFERENCES responsibles(id) ON DELETE SET NULL,
    FOREIGN KEY (user_id) REFERENCES users(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

SET FOREIGN_KEY_CHECKS = 1;
