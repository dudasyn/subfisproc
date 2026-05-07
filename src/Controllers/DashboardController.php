<?php
namespace App\Controllers;

use App\Models\Movement;
use App\Utils\Response;

class DashboardController {
    private $movementModel;

    public function __construct() {
        $this->movementModel = new Movement();
    }

    /**
     * Retorna as estatísticas do sistema para o Dashboard
     * Seguindo Skill: Architecture
     */
    public function index() {
        try {
            // Verifica autenticação (Pode ser injetado via middleware no futuro, 
            // por enquanto chamamos o utilitário)
            if (!isset($_SESSION['user_id'])) {
                return Response::json(['error' => 'Não autorizado'], 401);
            }

            // Captura as datas de início e fim opcionais dos filtros do painel
            $startDate = $_GET['start'] ?? null;
            $endDate = $_GET['end'] ?? null;

            $stats = $this->movementModel->getDashboardStats($startDate, $endDate);
            return Response::json($stats);
            
        } catch (\Exception $e) {
            return Response::json(['error' => $e->getMessage()], 500);
        }
    }
}
