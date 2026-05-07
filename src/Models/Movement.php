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
     * Calcula as estatísticas consolidadas e segmentadas por grupo alvo (SUBFIS e AFT)
     * para exibição dinâmica no Dashboard analítico.
     * 
     * @param string|null $startDate Data de início do período para fluxo de movimentos (Y-m-d)
     * @param string|null $endDate Data de término do período para fluxo de movimentos (Y-m-d)
     * @return array Mapa de estatísticas contendo dados de carga de trabalho, saídas, tramitações e auditores para SUBFIS e AFT.
     */
    public function getDashboardStats($startDate = null, $endDate = null) {
        $stats = [];

        // Define o período de datas padrão (ano corrente) caso não fornecido
        if (!$startDate) {
            $startDate = date('Y') . '-01-01';
        }
        if (!$endDate) {
            $endDate = date('Y-m-d');
        }

        // 1. Carga de Trabalho Atual do Grupo SUBFIS (Setor 316 e subsetores)
        // Conta apenas os processos cujo último trâmite registrado aponta para o grupo.
        $subfisCargaSql = "
            SELECT COUNT(*) 
            FROM movements m 
            INNER JOIN (
                SELECT process_id, MAX(id) as max_id 
                FROM movements 
                GROUP BY process_id
            ) latest ON m.id = latest.max_id
            INNER JOIN sectors s ON m.destination_sector_id = s.id 
            WHERE (s.id = 316 OR s.parent_id = 316)";
        $stats['subfis_carga'] = (int)$this->db->query($subfisCargaSql)->fetchColumn();

        // 2. Carga de Trabalho Atual do Grupo AFT (Setor 319 e subsetores)
        // Conta apenas os processos cujo último trâmite registrado aponta para o grupo.
        $aftCargaSql = "
            SELECT COUNT(*) 
            FROM movements m 
            INNER JOIN (
                SELECT process_id, MAX(id) as max_id 
                FROM movements 
                GROUP BY process_id
            ) latest ON m.id = latest.max_id
            INNER JOIN sectors s ON m.destination_sector_id = s.id 
            WHERE (s.id = 319 OR s.parent_id = 319)";
        $stats['aft_carga'] = (int)$this->db->query($aftCargaSql)->fetchColumn();

        // 3. Estatísticas de Fluxo (Saídas e Tramitações) no período com LAG()
        // Executa uma única varredura sequencial indexada em tempo recorde O(N log N).
        $flowSql = "
            SELECT 
                SUM(CASE WHEN prev_is_subfis = 1 AND curr_is_subfis = 0 THEN 1 ELSE 0 END) as subfis_saidas,
                SUM(CASE WHEN prev_is_subfis = 1 AND curr_is_subfis = 1 THEN 1 ELSE 0 END) as subfis_tramitacoes,
                SUM(CASE WHEN prev_is_aft = 1 AND curr_is_aft = 0 THEN 1 ELSE 0 END) as aft_saidas,
                SUM(CASE WHEN prev_is_aft = 1 AND curr_is_aft = 1 THEN 1 ELSE 0 END) as aft_tramitacoes
            FROM (
                SELECT 
                    m.id,
                    m.movement_date,
                    CASE WHEN s_curr.id = 316 OR s_curr.parent_id = 316 THEN 1 ELSE 0 END as curr_is_subfis,
                    CASE WHEN s_curr.id = 319 OR s_curr.parent_id = 319 THEN 1 ELSE 0 END as curr_is_aft,
                    LAG(CASE WHEN s_curr.id = 316 OR s_curr.parent_id = 316 THEN 1 ELSE 0 END) OVER (PARTITION BY m.process_id ORDER BY m.id) as prev_is_subfis,
                    LAG(CASE WHEN s_curr.id = 319 OR s_curr.parent_id = 319 THEN 1 ELSE 0 END) OVER (PARTITION BY m.process_id ORDER BY m.id) as prev_is_aft
                FROM movements m
                INNER JOIN sectors s_curr ON m.destination_sector_id = s_curr.id
            ) flow
            WHERE flow.movement_date >= :start_date AND flow.movement_date <= :end_date";
            
        $stmt = $this->db->prepare($flowSql);
        $stmt->execute([
            ':start_date' => $startDate,
            ':end_date' => $endDate
        ]);
        $flow = $stmt->fetch(PDO::FETCH_ASSOC);
        
        $stats['subfis_saidas'] = (int)($flow['subfis_saidas'] ?? 0);
        $stats['subfis_tramitacoes'] = (int)($flow['subfis_tramitacoes'] ?? 0);
        $stats['aft_saidas'] = (int)($flow['aft_saidas'] ?? 0);
        $stats['aft_tramitacoes'] = (int)($flow['aft_tramitacoes'] ?? 0);

        // 4. Auditores Responsáveis Ativos no Grupo SUBFIS
        $subfisAuditorsSql = "
            SELECT COUNT(*) 
            FROM responsibles r 
            INNER JOIN sectors s ON r.sector_id = s.id 
            WHERE r.active = 1 AND (s.id = 316 OR s.parent_id = 316)";
        $stats['subfis_auditores'] = (int)$this->db->query($subfisAuditorsSql)->fetchColumn();

        // 5. Auditores Responsáveis Ativos no Grupo AFT
        $aftAuditorsSql = "
            SELECT COUNT(*) 
            FROM responsibles r 
            INNER JOIN sectors s ON r.sector_id = s.id 
            WHERE r.active = 1 AND (s.id = 319 OR s.parent_id = 319)";
        $stats['aft_auditores'] = (int)$this->db->query($aftAuditorsSql)->fetchColumn();

        // 6. Propriedades de Legado / Compatibilidade Retroativa de Visões
        $stats['entradas'] = $stats['subfis_tramitacoes'] + $stats['aft_tramitacoes'];
        $stats['saidas'] = $stats['subfis_saidas'] + $stats['aft_saidas'];
        $stats['total_processes'] = (int)$this->db->query('SELECT COUNT(*) FROM processes')->fetchColumn();
        $stats['total_responsibles'] = (int)$this->db->query('SELECT COUNT(*) FROM responsibles WHERE active = 1')->fetchColumn();
        $stats['total_sectors'] = (int)$this->db->query('SELECT COUNT(*) FROM sectors WHERE active = 1')->fetchColumn();

        // Última importação concluída
        $lastImportSql = "
            SELECT version_label, completed_at, stats_json 
            FROM import_versions 
            WHERE status = 'completed' 
            ORDER BY completed_at DESC 
            LIMIT 1";
        try {
            $lastImportStmt = $this->db->query($lastImportSql);
            $lastImport = $lastImportStmt->fetch(PDO::FETCH_ASSOC);
            if ($lastImport) {
                $stats['last_import'] = [
                    'label' => $lastImport['version_label'],
                    'completed_at' => $lastImport['completed_at'],
                    'stats' => json_decode($lastImport['stats_json'] ?? '{}', true)
                ];
            } else {
                $stats['last_import'] = null;
            }
        } catch (\Exception $e) {
            $stats['last_import'] = null;
        }

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
