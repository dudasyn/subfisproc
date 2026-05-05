<?php

namespace App\Core;

use App\Utils\Response;

/**
 * Gerenciador de rotas simplificado para a aplicação.
 * Responsável por mapear URIs e métodos HTTP para Controllers e Actions.
 */
class Router {
    /** @var array Armazena as rotas registradas */
    private $routes = [];

    /**
     * Registra uma rota para o método GET.
     * @param string $path URI da rota.
     * @param array|callable $callback Função ou [Controller, Action].
     */
    public function get($path, $callback) {
        $this->addRoute('GET', $path, $callback);
    }

    /**
     * Registra uma rota para o método POST.
     * @param string $path URI da rota.
     * @param array|callable $callback Função ou [Controller, Action].
     */
    public function post($path, $callback) {
        $this->addRoute('POST', $path, $callback);
    }

    /**
     * Registra uma rota para o método PUT.
     * @param string $path URI da rota.
     * @param array|callable $callback Função ou [Controller, Action].
     */
    public function put($path, $callback) {
        $this->addRoute('PUT', $path, $callback);
    }

    /**
     * Registra uma rota para o método DELETE.
     * @param string $path URI da rota.
     * @param array|callable $callback Função ou [Controller, Action].
     */
    public function delete($path, $callback) {
        $this->addRoute('DELETE', $path, $callback);
    }

    /**
     * Adiciona internamente a rota ao array de mapeamento.
     */
    private function addRoute($method, $path, $callback) {
        $this->routes[] = [
            'method' => $method,
            'path' => $path,
            'callback' => $callback
        ];
    }

    /**
     * Executa a busca pela rota correspondente à requisição atual.
     * Intercepta o método HTTP e a URI enviada pelo servidor.
     * Suporta parâmetros dinâmicos no formato {param} (ex: /api/import/batch/{id}).
     */
    public function run() {
        $method = $_SERVER['REQUEST_METHOD'];
        $uri = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);

        foreach ($this->routes as $route) {
            // Converte placeholders {param} em grupos de captura regex
            $pattern = preg_replace('/\{(\w+)\}/', '([^/]+)', $route['path']);
            $pattern = "#^{$pattern}$#";

            if ($route['method'] === $method && preg_match($pattern, $uri, $matches)) {
                // Remove o match completo, mantém apenas os parâmetros capturados
                array_shift($matches);

                // Caso o callback seja o padrão [ControllerClass::class, 'method']
                if (is_array($route['callback'])) {
                    $controllerName = $route['callback'][0];
                    $action = $route['callback'][1];
                    
                    // Instancia o Controller dinamicamente e executa a Action
                    // Parâmetros capturados são passados como argumentos ao método
                    $controller = new $controllerName();
                    return call_user_func_array([$controller, $action], $matches);
                }
                
                // Suporte para funções anônimas (closures) com parâmetros
                return call_user_func_array($route['callback'], $matches);
            }
        }

        // Se nenhuma rota coincidir, retorna erro 404 padronizado
        Response::error('Endpoint not found', 404);
    }
}
