<?php
session_start();

spl_autoload_register(function ($class) {
    $prefix = 'App\\';
    $base_dir = __DIR__ . '/../src/';

    $len = strlen($prefix);
    if (strncmp($prefix, $class, $len) !== 0) {
        return;
    }

    $relative_class = substr($class, $len);
    $file = $base_dir . str_replace('\\', '/', $relative_class) . '.php';

    if (file_exists($file)) {
        require_once $file;
    }
});

use App\Core\Router;
use App\Controllers\AuthController;
use App\Controllers\UserController;
use App\Controllers\SectorController;
use App\Controllers\DashboardController;
use App\Controllers\ImportController;

$router = new Router();

// ========================
// Rotas de Autenticação
// ========================
$router->post('/api/auth/login', [AuthController::class, 'login']);
$router->get('/api/auth/logout', [AuthController::class, 'logout']);
$router->get('/api/auth/session', [AuthController::class, 'session']);

// ========================
// Rotas de Usuários
// ========================
$router->get('/api/users', [UserController::class, 'index']);

// Rotas de Dashboard
$router->get('/api/dashboard', [DashboardController::class, 'index']);
$router->post('/api/users', [UserController::class, 'store']);
$router->put('/api/users', [UserController::class, 'update']);
$router->delete('/api/users', [UserController::class, 'destroy']);
$router->post('/api/users/reset-password', [UserController::class, 'resetPassword']);
$router->post('/api/users/change-password', [UserController::class, 'changePassword']);

// ========================
// Rotas de Importação
// ========================
$router->get('/api/import/history', [ImportController::class, 'history']);
$router->post('/api/import/validate', [ImportController::class, 'validate']);
$router->post('/api/import/execute', [ImportController::class, 'execute']);
$router->delete('/api/import/batch', [ImportController::class, 'undo']);
$router->post('/api/import/restore', [ImportController::class, 'restore']);
$router->post('/api/import/legacy-sql', [ImportController::class, 'importLegacySql']);
$router->post('/api/import/snapshot', [ImportController::class, 'createManual']);
$router->get('/api/import/snapshot/download', [ImportController::class, 'download']);
$router->post('/api/import/snapshot/upload', [ImportController::class, 'upload']);
$router->get('/api/import/snapshots', [ImportController::class, 'snapshots']);
$router->get('/api/import/logs', [ImportController::class, 'logs']);
$router->delete('/api/import/wipe', [ImportController::class, 'wipe']);

// Em breve adicionaremos as rotas para processos e movimentos...

$router->run();
