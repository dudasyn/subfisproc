-- ================================================
-- Migration 003: Tabela de Logs de Importação
-- Registro detalhado de cada etapa da importação para diagnóstico
-- ================================================

CREATE TABLE IF NOT EXISTS import_logs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    batch_id VARCHAR(50) NOT NULL,
    log_level ENUM('INFO', 'WARNING', 'ERROR') NOT NULL DEFAULT 'INFO',
    phase ENUM('validation', 'snapshot', 'import', 'rollback', 'restore') NOT NULL,
    message TEXT NOT NULL,
    context_json TEXT DEFAULT NULL,
    row_number INT DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_batch (batch_id),
    INDEX idx_level (log_level),
    FOREIGN KEY (batch_id) REFERENCES import_versions(batch_id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
