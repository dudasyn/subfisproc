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
