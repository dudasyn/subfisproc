-- ================================================
-- Migration 001: Tabela de Versões de Importação
-- Rastreia cada importação com metadados, status e referência ao snapshot
-- ================================================

CREATE TABLE IF NOT EXISTS import_versions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    batch_id VARCHAR(50) UNIQUE NOT NULL,
    version_label VARCHAR(100) NOT NULL,
    snapshot_file VARCHAR(255) DEFAULT NULL,
    status ENUM('pending', 'running', 'completed', 'failed', 'rolled_back') NOT NULL DEFAULT 'pending',
    user_id INT NOT NULL,
    stats_json TEXT DEFAULT NULL,
    error_message TEXT DEFAULT NULL,
    started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP NULL,
    FOREIGN KEY (user_id) REFERENCES users(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
