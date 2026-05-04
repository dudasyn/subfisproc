<?php
namespace App\Models;

use App\Config\Database;
use PDO;

/**
 * Classe Model responsável pela manipulação de dados de movimentações.
 * Gerencia consultas de histórico e estatísticas de fluxo de processos.
 */
class Movement {
    /** @var PDO Conexão com o banco de dados */
    private $db;

    public function __construct() {
        $this->db = Database::getConnection();
    }

    /**
     * Calcula as estatísticas consolidadas para exibição no Dashboard.
     * Consolida entradas, saídas e total de processos.
     * 
     * @return array Mapa de estatísticas contendo entradas, saídas, total e atividade recente.
     */
    public function getDashboardStats() {
        $stats = [];

        // Query complexa para contar apenas o estado ATUAL de cada processo.
        // O INNER JOIN com o MAX(id) garante que só estamos olhando para o último movimento de cada processo.
        $countSql = "
            SELECT 
                SUM(CASE WHEN m.action = 'ENTRADA' THEN 1 ELSE 0 END) as entradas,
                SUM(CASE WHEN m.action = 'SAIDA' THEN 1 ELSE 0 END) as saidas
            FROM movements m
            INNER JOIN (
                SELECT process_id, MAX(id) as max_id
                FROM movements
                GROUP BY process_id
            ) latest ON m.id = latest.max_id";
        
        $stmt = $this->db->query($countSql);
        $counts = $stmt->fetch(PDO::FETCH_ASSOC);
        
        // Garante que os valores retornados sejam inteiros
        $stats['entradas'] = (int)($counts['entradas'] ?? 0);
        $stats['saidas'] = (int)($counts['saidas'] ?? 0);
        
        // Total de processos
        $stats['total_processes'] = (int)$this->db->query('SELECT COUNT(*) FROM processes')->fetchColumn();

        // Atividade recente (últimos 7 movimentos)
        $recentSql = '
            SELECT m.id, p.process_number, m.action, m.movement_date, 
                   p.parent_id,
                   (SELECT COUNT(*) FROM processes WHERE parent_id = p.id) as attachments_count,
                   s.name as destination_sector, u.name as user_name
            FROM movements m
            JOIN processes p ON m.process_id = p.id
            JOIN sectors s ON m.destination_sector_id = s.id
            JOIN users u ON m.user_id = u.id
            ORDER BY m.created_at DESC
            LIMIT 7
        ';
        
        $stats['recent_activity'] = $this->db->query($recentSql)->fetchAll(PDO::FETCH_ASSOC);

        return $stats;
    }
}
