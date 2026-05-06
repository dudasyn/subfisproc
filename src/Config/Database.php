<?php

namespace App\Config;

use PDO;
use PDOException;
use App\Utils\Response;

/**
 * Classe responsável pela gestão da conexão com o banco de dados.
 * Implementa o padrão Singleton para garantir uma única conexão PDO em toda a execução.
 */
class Database {
    /** @var PDO|null Instância única da conexão */
    private static $instance = null;

    private function __construct() {}
    private function __clone() {}

    /**
     * Obtém a conexão PDO ativa. Caso não exista, cria uma nova.
     * 
     * @return PDO A instância da conexão com o banco de dados.
     */
    public static function getConnection() {
        if (self::$instance === null) {
            // Carrega variáveis de ambiente do arquivo .env na raiz
            self::loadEnv(__DIR__ . '/../../.env');

            // Configurações de conexão (Prioriza variáveis de ambiente, com fallback para Docker)
            $db_host = getenv('DB_HOST') ?: 'db'; 
            $db_user = getenv('DB_USER') ?: 'root';
            $db_pass = getenv('DB_PASS') ?: '';
            $db_name = getenv('DB_NAME') ?: 'subfisproc';

            try {
                // Instancia PDO com suporte a UTF-8 e emite exceções em caso de erro
                self::$instance = new PDO("mysql:host=$db_host;dbname=$db_name;charset=utf8mb4", $db_user, $db_pass);
                self::$instance->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
                self::$instance->setAttribute(PDO::ATTR_DEFAULT_FETCH_MODE, PDO::FETCH_ASSOC);

                // Garante a existência das tabelas de controle de versão e logs de importação
                self::$instance->exec("
                    CREATE TABLE IF NOT EXISTS `import_versions` (
                        `id` INT AUTO_INCREMENT PRIMARY KEY,
                        `batch_id` VARCHAR(50) UNIQUE NOT NULL,
                        `version_label` VARCHAR(100) NOT NULL,
                        `snapshot_file` VARCHAR(255) DEFAULT NULL,
                        `status` ENUM('pending', 'running', 'completed', 'failed', 'rolled_back') NOT NULL DEFAULT 'pending',
                        `user_id` INT NOT NULL,
                        `stats_json` TEXT DEFAULT NULL,
                        `error_message` TEXT DEFAULT NULL,
                        `started_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                        `completed_at` TIMESTAMP NULL,
                        FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE
                    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
                ");

                self::$instance->exec("
                    CREATE TABLE IF NOT EXISTS `import_logs` (
                        `id` INT AUTO_INCREMENT PRIMARY KEY,
                        `batch_id` VARCHAR(50) NOT NULL,
                        `log_level` ENUM('INFO', 'WARNING', 'ERROR') NOT NULL DEFAULT 'INFO',
                        `phase` ENUM('validation', 'snapshot', 'import', 'rollback', 'restore') NOT NULL,
                        `message` TEXT NOT NULL,
                        `context_json` TEXT DEFAULT NULL,
                        `row_number` INT DEFAULT NULL,
                        `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                        INDEX `idx_batch` (`batch_id`),
                        INDEX `idx_level` (`log_level`),
                        FOREIGN KEY (`batch_id`) REFERENCES `import_versions`(`batch_id`) ON DELETE CASCADE
                    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
                ");
            } catch (PDOException $e) {
                // Utiliza o helper de Resposta para encerrar com erro 500 JSON amigável
                Response::error('Database connection failed: ' . $e->getMessage(), 500);
            }
        }
        return self::$instance;
    }

    /**
     * Carrega variáveis de ambiente de um arquivo .env para o sistema (putenv e $_ENV).
     * 
     * @param string $path Caminho absoluto para o arquivo .env
     */
    private static function loadEnv($path) {
        if (!file_exists($path)) return;

        $lines = file($path, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
        foreach ($lines as $line) {
            // Ignora comentários e linhas sem o sinal de igual
            if (strpos(trim($line), '#') === 0 || strpos($line, '=') === false) continue;
            
            list($name, $value) = explode('=', $line, 2);
            $name = trim($name);
            $value = trim($value);

            // Só carrega se a variável ainda não estiver definida no ambiente
            if (!array_key_exists($name, $_SERVER) && !array_key_exists($name, $_ENV)) {
                putenv(sprintf('%s=%s', $name, $value));
                $_ENV[$name] = $value;
                $_SERVER[$name] = $value;
            }
        }
    }
}
