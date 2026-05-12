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
     * Retorna recursivamente todos os IDs de setores descendentes de um setor pai (incluindo o próprio pai).
     * 
     * @param int $parentId ID do setor pai.
     * @return array Array de IDs de setores.
     */
    private function getSectorDescendants(int $parentId): array {
        $sectorIds = [$parentId];
        $currentLevel = [$parentId];
        
        while (!empty($currentLevel)) {
            $inClause = implode(',', array_map('intval', $currentLevel));
            $stmt = $this->db->query("SELECT id FROM sectors WHERE parent_id IN ($inClause)");
            $children = $stmt->fetchAll(PDO::FETCH_COLUMN);
            
            if (empty($children)) {
                break;
            }
            
            $sectorIds = array_merge($sectorIds, $children);
            $currentLevel = $children;
        }
        
        return array_unique($sectorIds);
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

        // Recupera de forma recursiva os setores pertencentes a cada grupo administrativo
        $subfisSectorIds = $this->getSectorDescendants(316);
        $aftSectorIds = $this->getSectorDescendants(319);

        $subfisIdsStr = implode(',', $subfisSectorIds);
        $aftIdsStr = implode(',', $aftSectorIds);

        // 1. Sob Custódia (Carga de Trabalho Atual) do Grupo SUBFIS (Setor 316 e subsetores) - Sempre data corrente
        // Conta apenas os processos cujo último trâmite registrado aponta para o grupo na data corrente.
        $subfisCargaSql = "
            SELECT COUNT(*) 
            FROM movements m 
            INNER JOIN (
                SELECT process_id, MAX(id) as max_id 
                FROM movements 
                GROUP BY process_id
            ) latest ON m.id = latest.max_id
            WHERE m.destination_sector_id IN ($subfisIdsStr)";
        $stats['subfis_carga'] = (int)$this->db->query($subfisCargaSql)->fetchColumn();

        // 2. Sob Custódia (Carga de Trabalho Atual) do Grupo AFT (Setor 319 e subsetores) - Sempre data corrente
        // Conta apenas os processos cujo último trâmite registrado aponta para o grupo na data corrente.
        $aftCargaSql = "
            SELECT COUNT(*) 
            FROM movements m 
            INNER JOIN (
                SELECT process_id, MAX(id) as max_id 
                FROM movements 
                GROUP BY process_id
            ) latest ON m.id = latest.max_id
            WHERE m.destination_sector_id IN ($aftIdsStr)";
        $stats['aft_carga'] = (int)$this->db->query($aftCargaSql)->fetchColumn();

        // 3. Estatísticas de Fluxo (Entradas, Saídas de Processos e Tramitações) no período com LAG()
        // Executa uma única varredura sequencial indexada em tempo recorde O(N log N).
        $flowSql = "
            SELECT 
                SUM(CASE WHEN (prev_is_subfis = 0 OR prev_is_subfis IS NULL) AND curr_is_subfis = 1 THEN 1 ELSE 0 END) as subfis_entradas,
                SUM(CASE WHEN prev_is_subfis = 1 AND curr_is_subfis = 0 THEN 1 ELSE 0 END) as subfis_saidas,
                SUM(CASE WHEN prev_is_subfis = 1 AND curr_is_subfis = 1 THEN 1 ELSE 0 END) as subfis_tramitacoes,
                SUM(CASE WHEN (prev_is_aft = 0 OR prev_is_aft IS NULL) AND curr_is_aft = 1 THEN 1 ELSE 0 END) as aft_entradas,
                SUM(CASE WHEN prev_is_aft = 1 AND curr_is_aft = 0 THEN 1 ELSE 0 END) as aft_saidas,
                SUM(CASE WHEN prev_is_aft = 1 AND curr_is_aft = 1 THEN 1 ELSE 0 END) as aft_tramitacoes
            FROM (
                SELECT 
                    m.id,
                    m.movement_date,
                    CASE WHEN m.destination_sector_id IN ($subfisIdsStr) THEN 1 ELSE 0 END as curr_is_subfis,
                    CASE WHEN m.destination_sector_id IN ($aftIdsStr) THEN 1 ELSE 0 END as curr_is_aft,
                    LAG(CASE WHEN m.destination_sector_id IN ($subfisIdsStr) THEN 1 ELSE 0 END) OVER (PARTITION BY m.process_id ORDER BY m.id) as prev_is_subfis,
                    LAG(CASE WHEN m.destination_sector_id IN ($aftIdsStr) THEN 1 ELSE 0 END) OVER (PARTITION BY m.process_id ORDER BY m.id) as prev_is_aft
                FROM movements m
            ) flow
            WHERE flow.movement_date >= :start_date AND flow.movement_date <= :end_date";
            
        $stmt = $this->db->prepare($flowSql);
        $stmt->execute([
            ':start_date' => $startDate,
            ':end_date' => $endDate
        ]);
        $flow = $stmt->fetch(PDO::FETCH_ASSOC);
        
        $stats['subfis_entradas'] = (int)($flow['subfis_entradas'] ?? 0);
        $stats['subfis_saidas'] = (int)($flow['subfis_saidas'] ?? 0);
        $stats['subfis_tramitacoes'] = (int)($flow['subfis_tramitacoes'] ?? 0);
        $stats['aft_entradas'] = (int)($flow['aft_entradas'] ?? 0);
        $stats['aft_saidas'] = (int)($flow['aft_saidas'] ?? 0);
        $stats['aft_tramitacoes'] = (int)($flow['aft_tramitacoes'] ?? 0);

        // 4. Auditores Responsáveis Ativos no Grupo SUBFIS
        // Usa a tabela pivot responsible_sectors (um auditor pode estar em 0 ou N setores).
        $subfisAuditorsSql = "
            SELECT COUNT(DISTINCT r.id) 
            FROM responsibles r 
            INNER JOIN responsible_sectors rs ON rs.responsible_id = r.id
            WHERE r.active = 1 AND rs.sector_id IN ($subfisIdsStr)";
        $stats['subfis_auditores'] = (int)$this->db->query($subfisAuditorsSql)->fetchColumn();

        // 5. Auditores Responsáveis Ativos no Grupo AFT
        // Usa a tabela pivot responsible_sectors (um auditor pode estar em 0 ou N setores).
        $aftAuditorsSql = "
            SELECT COUNT(DISTINCT r.id) 
            FROM responsibles r 
            INNER JOIN responsible_sectors rs ON rs.responsible_id = r.id
            WHERE r.active = 1 AND rs.sector_id IN ($aftIdsStr)";
        $stats['aft_auditores'] = (int)$this->db->query($aftAuditorsSql)->fetchColumn();

        // 6. Propriedades de Legado / Compatibilidade Retroativa de Visões
        $stats['entradas'] = $stats['subfis_entradas'] + $stats['aft_entradas'];
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

        // 6. Estatísticas Mensais Comparativas (Entrada de Processos Mês a Mês)
        $currentYear = (int)date('Y');
        $startYear = $currentYear - 2;
        
        $monthlySql = "
            SELECT 
                YEAR(movement_date) as year,
                MONTH(movement_date) as month,
                COUNT(*) as count
            FROM movements
            WHERE action = 'ENTRADA'
              AND movement_date IS NOT NULL
              AND YEAR(movement_date) >= :start_year
              AND YEAR(movement_date) <= :current_year
            GROUP BY YEAR(movement_date), MONTH(movement_date)
            ORDER BY year ASC, month ASC";
            
        try {
            $stmt = $this->db->prepare($monthlySql);
            $stmt->execute([
                ':start_year' => $startYear,
                ':current_year' => $currentYear
            ]);
            $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);
            
            $monthlyStats = [];
            for ($y = $startYear; $y <= $currentYear; $y++) {
                $monthlyStats[(string)$y] = array_fill(0, 12, 0);
            }
            
            foreach ($rows as $row) {
                $yStr = (string)$row['year'];
                $mIdx = (int)$row['month'] - 1;
                if (isset($monthlyStats[$yStr]) && $mIdx >= 0 && $mIdx < 12) {
                    $monthlyStats[$yStr][$mIdx] = (int)$row['count'];
                }
            }
            $stats['monthly_stats'] = $monthlyStats;
        } catch (\Exception $e) {
            $stats['monthly_stats'] = [];
        }

        return $stats;
    }
}
