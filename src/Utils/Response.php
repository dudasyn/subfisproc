<?php

namespace App\Utils;

/**
 * Classe utilitária para padronizar as respostas da API em formato JSON.
 */
class Response {
    /**
     * Envia uma resposta JSON e encerra a execução do script.
     * 
     * @param array $data Dados a serem convertidos em JSON.
     * @param int $statusCode Código de status HTTP (default 200).
     */
    public static function json(array $data, int $statusCode = 200) {
        http_response_code($statusCode);
        header('Content-Type: application/json');
        echo json_encode($data);
        exit;
    }

    /**
     * Envia uma resposta de erro padronizada.
     * 
     * @param string $message Mensagem de erro descritiva.
     * @param int $statusCode Código de status HTTP de erro (default 400).
     */
    public static function error(string $message, int $statusCode = 400) {
        self::json(['error' => $message], $statusCode);
    }
}
