<?php
require 'config.php';
checkAuth();

header('Content-Type: application/json');

$method = $_SERVER['REQUEST_METHOD'];

/**
 * Retorna a lista de IDs de setores autorizados para o usuário atual.
 * - Superadmin recebe acesso automático aos setores SUBFIS e AFT.
 * - Setores pais recebem acesso automático aos seus setores filhos.
 * - Inclui lotação direta e auditores responsáveis ativos.
 */
function getAuthorizedSectors() {
    global $pdo;
    $sectors = [];
    if (!isset($_SESSION['user_id'])) return $sectors;
    
    // Regra especial: Superadmin faz parte dos setores AFT e SUBFIS por padrão
    if ($_SESSION['name'] === 'Superadmin') {
        $stmt_super = $pdo->query("SELECT id FROM sectors WHERE alias IN ('SUBFIS', 'AFT')");
        $super_sector_ids = $stmt_super->fetchAll(PDO::FETCH_COLUMN);
        foreach ($super_sector_ids as $sid) {
            $sectors[] = (int)$sid;
        }
    }
    
    if (!empty($_SESSION['sector_id'])) {
        $primary_sector_id = (int)$_SESSION['sector_id'];
        $sectors[] = $primary_sector_id;
        
        // REGRA DE NEGÓCIO: Se for setor Pai, inclui automaticamente todos os seus setores filhos
        $stmt_children = $pdo->prepare('SELECT id FROM sectors WHERE parent_id = ?');
        $stmt_children->execute([$primary_sector_id]);
        $child_ids = $stmt_children->fetchAll(PDO::FETCH_COLUMN);
        foreach ($child_ids as $cid) {
            $sectors[] = (int)$cid;
        }
    }
    
    // Buscar setores onde o usuário está vinculado como auditor/responsável ativo
    $stmt = $pdo->prepare('
        SELECT rs.sector_id 
        FROM responsible_sectors rs
        JOIN responsibles r ON rs.responsible_id = r.id
        WHERE r.name = ? AND r.active = 1
    ');
    $stmt->execute([$_SESSION['name']]);
    $sectors = array_merge($sectors, $stmt->fetchAll(PDO::FETCH_COLUMN));
    return array_map('intval', array_unique($sectors));
}

if ($method === 'GET') {
    // List recent movements or history of a specific process
    $process_id = $_GET['process_id'] ?? null;
    $process_number = $_GET['process_number'] ?? null;
    $latest = $_GET['latest'] ?? null;
    
    if ($latest) {
        // Return latest 10 unique processes that had movements
        $stmt = $pdo->query('
            SELECT m.id, p.process_number, p.subject, m.movement_date, m.action, 
                   p.parent_id,
                   (SELECT COUNT(*) FROM processes p_sub WHERE p_sub.parent_id = p.id) as attachments_count,
                   (SELECT p_p.process_number FROM processes p_p WHERE p_p.id = p.parent_id) as parent_process_number,
                   s.name as destination_sector, u.name as user_name,
                   r.name as responsible_name
            FROM movements m
            JOIN processes p ON m.process_id = p.id
            JOIN sectors s ON m.destination_sector_id = s.id
            JOIN users u ON m.user_id = u.id
            LEFT JOIN responsibles r ON m.responsible_id = r.id
            WHERE m.id IN (
                SELECT MAX(id) FROM movements GROUP BY process_id
            )
            ORDER BY m.created_at DESC
            LIMIT 10
        ');
        jsonResponse($stmt->fetchAll());
    } elseif ($process_id) {
        $stmt = $pdo->prepare('
            SELECT m.id, m.movement_date, m.action, m.created_at, 
                   s.name as destination_sector, u.name as user_name,
                   r.name as responsible_name
            FROM movements m
            JOIN sectors s ON m.destination_sector_id = s.id
            JOIN users u ON m.user_id = u.id
            LEFT JOIN responsibles r ON m.responsible_id = r.id
            WHERE m.process_id = ?
            ORDER BY m.movement_date DESC, m.created_at DESC
        ');
        $stmt->execute([$process_id]);
        jsonResponse($stmt->fetchAll());
    } elseif ($process_number) {
        // Fetch process details and last movement
        $stmt = $pdo->prepare('
            SELECT p_main.id, p_main.subject, p_main.requester, p_main.document_number, p_main.observations, p_main.parent_id,
                   (SELECT COUNT(*) FROM processes p_sub WHERE p_sub.parent_id = p_main.id) as attachments_count,
                   (SELECT p_parent.process_number FROM processes p_parent WHERE p_parent.id = p_main.parent_id) as parent_process_number
            FROM processes p_main
            WHERE p_main.process_number = ?
        ');
        $stmt->execute([$process_number]);
        $process = $stmt->fetch();
        
        if ($process) {
            // REGRA DE NEGÓCIO: Usuários normais só acessam processos que pertençam ou passaram por setores autorizados
            if ($_SESSION['role'] !== 'Admin') {
                $auth_sectors = getAuthorizedSectors();
                if (empty($auth_sectors)) {
                    jsonResponse(['error' => 'Acesso negado. Você não possui setores autorizados.'], 403);
                }
                
                $placeholders = implode(',', array_fill(0, count($auth_sectors), '?'));
                $stmt_auth = $pdo->prepare("
                    SELECT COUNT(*) 
                    FROM movements 
                    WHERE process_id = ? AND destination_sector_id IN ($placeholders)
                ");
                $stmt_auth->execute(array_merge([$process['id']], $auth_sectors));
                $has_access = (int)$stmt_auth->fetchColumn() > 0;
                
                if (!$has_access) {
                    jsonResponse(['error' => 'Acesso negado. Este processo não pertence e nunca tramitou por seus setores autorizados.'], 403);
                }
            }

            // Get last movement and its sector info
            $stmt = $pdo->prepare('
                SELECT m.action, s.is_internal as sector_is_internal, m.responsible_id, s.name as sector_name, s.id as sector_id
                FROM movements m 
                JOIN sectors s ON m.destination_sector_id = s.id
                WHERE m.process_id = ? 
                ORDER BY m.movement_date DESC, m.created_at DESC 
                LIMIT 1
            ');
            $stmt->execute([$process['id']]);
            $last_movement = $stmt->fetch();
            
             $process['last_action'] = $last_movement ? $last_movement['action'] : null;
            $process['last_responsible_id'] = $last_movement ? $last_movement['responsible_id'] : null;
            $process['last_sector_is_internal'] = $last_movement ? (bool)$last_movement['sector_is_internal'] : true; // Default to true if new
            $process['last_sector_id'] = $last_movement ? $last_movement['sector_id'] : null;
            $process['last_sector_name'] = $last_movement ? $last_movement['sector_name'] : 'Nenhum';

            // REGRA DE CUSTÓDIA DINÂMICA: Verifica se o processo está em um setor de posse do usuário ativo
            $auth_sectors = getAuthorizedSectors();
            $process['is_authorized_custody'] = false;
            if ($_SESSION['role'] === 'Admin') {
                $process['is_authorized_custody'] = true;
            } elseif ($process['last_action'] === 'ENTRADA' && !empty($auth_sectors) && in_array((int)$process['last_sector_id'], $auth_sectors)) {
                $process['is_authorized_custody'] = true;
            }

            // Get list of attached processes if it's a parent
            $process['attached_processes'] = [];
            if ($process['attachments_count'] > 0) {
                $stmt = $pdo->prepare('SELECT process_number FROM processes WHERE parent_id = ?');
                $stmt->execute([$process['id']]);
                $process['attached_processes'] = $stmt->fetchAll(PDO::FETCH_COLUMN);
            }

            jsonResponse(['exists' => true, 'process' => $process]);
        } else {
            jsonResponse(['exists' => false]);
        }
    } else {
        // Advanced Search and Lists based on 'scope' parameter
        $scope = $_GET['scope'] ?? ''; // 'analysis', 'tramitados', 'outside'
        $search = $_GET['search'] ?? '';
        $sector_id = $_GET['sector_id'] ?? null;
        $responsible_id = $_GET['responsible_id'] ?? null;
        $page = isset($_GET['page']) ? (int)$_GET['page'] : 1;
        $limit = isset($_GET['limit']) ? (int)$_GET['limit'] : 5; // Default 5 for Area 1 & 2
        
        if ($scope === 'outside') {
            $limit = isset($_GET['limit']) ? (int)$_GET['limit'] : 50; // Larger list for Search area
        }
        $offset = ($page - 1) * $limit;
        
        $auth_sectors = getAuthorizedSectors();
        
        $sql = "SELECT DISTINCT p.id, p.process_number, p.subject, p.requester, p.parent_id,
                (SELECT COUNT(*) FROM processes p_sub WHERE p_sub.parent_id = p.id) as attachments_count,
                (SELECT p_p.process_number FROM processes p_p WHERE p_p.id = p.parent_id) as parent_process_number 
                FROM processes p ";
                
        $where_clauses = [];
        $params = [];
        
        if ($scope === 'analysis') {
            // Area 1: Under active custody of authorized sectors (last action = ENTRADA to authorized sectors)
            if (empty($auth_sectors)) {
                jsonResponse(['processes' => [], 'pagination' => ['total' => 0, 'page' => 1, 'limit' => $limit, 'pages' => 0]]);
            }
            $sql .= " JOIN movements m ON p.id = m.process_id ";
            $placeholders = implode(',', array_fill(0, count($auth_sectors), '?'));
            $where_clauses[] = "m.id IN (SELECT MAX(id) FROM movements GROUP BY process_id) 
                                AND m.destination_sector_id IN ($placeholders) 
                                AND m.action = 'ENTRADA'";
            $params = array_merge($params, $auth_sectors);
        } elseif ($scope === 'tramitados') {
            // Area 2: Previously in authorized sectors but currently NOT under active custody of those sectors
            if (empty($auth_sectors)) {
                jsonResponse(['processes' => [], 'pagination' => ['total' => 0, 'page' => 1, 'limit' => $limit, 'pages' => 0]]);
            }
            $sql .= " JOIN movements m_hist ON p.id = m_hist.process_id ";
            $placeholders = implode(',', array_fill(0, count($auth_sectors), '?'));
            $where_clauses[] = "m_hist.destination_sector_id IN ($placeholders)";
            $params = array_merge($params, $auth_sectors);
            
            // Exclude processes currently under custody in authorized sectors
            $where_clauses[] = "p.id NOT IN (
                SELECT m_aux.process_id 
                FROM movements m_aux 
                WHERE m_aux.id IN (SELECT MAX(id) FROM movements GROUP BY process_id) 
                  AND m_aux.destination_sector_id IN ($placeholders) 
                  AND m_aux.action = 'ENTRADA'
            )";
            $params = array_merge($params, $auth_sectors);
        } else {
            // Area 3: Buscar Fora do Setor (All or scoped by "meus processos")
            if ($_SESSION['role'] !== 'Admin') {
                if (empty($auth_sectors)) {
                    jsonResponse(['processes' => [], 'pagination' => ['total' => 0, 'page' => 1, 'limit' => $limit, 'pages' => 0]]);
                }
                $sql .= " JOIN movements m_auth ON p.id = m_auth.process_id ";
                $placeholders = implode(',', array_fill(0, count($auth_sectors), '?'));
                $where_clauses[] = "m_auth.destination_sector_id IN ($placeholders)";
                $params = array_merge($params, $auth_sectors);
            }
            
            if ($sector_id) {
                $sql .= " JOIN movements m_sec ON p.id = m_sec.process_id ";
                $where_clauses[] = "m_sec.destination_sector_id = ?";
                $params[] = $sector_id;
            }
        }
        
        if ($responsible_id) {
            $sql .= " JOIN movements m_resp ON p.id = m_resp.process_id ";
            $where_clauses[] = "m_resp.responsible_id = ?";
            $params[] = $responsible_id;
        }
        
        if ($search) {
            $where_clauses[] = "p.process_number LIKE ?";
            $params[] = '%' . $search . '%';
        }
        
        if (!empty($where_clauses)) {
            $sql .= " WHERE " . implode(" AND ", $where_clauses);
        }
        
        // Sorting
        if ($scope === 'analysis') {
            $sql .= " ORDER BY m.movement_date DESC, m.id DESC";
        } elseif ($scope === 'tramitados') {
            $sql .= " ORDER BY m_hist.movement_date DESC, m_hist.id DESC";
        } else {
            $sql .= " ORDER BY p.id DESC";
        }
        
        // Count for pagination
        $count_sql = "SELECT COUNT(DISTINCT p.id) FROM processes p ";
        if ($scope === 'analysis') {
            $count_sql .= " JOIN movements m ON p.id = m.process_id ";
        } elseif ($scope === 'tramitados') {
            $count_sql .= " JOIN movements m_hist ON p.id = m_hist.process_id ";
        } else {
            if ($_SESSION['role'] !== 'Admin') {
                $count_sql .= " JOIN movements m_auth ON p.id = m_auth.process_id ";
            }
            if ($sector_id) {
                $count_sql .= " JOIN movements m_sec ON p.id = m_sec.process_id ";
            }
        }
        if ($responsible_id) {
            $count_sql .= " JOIN movements m_resp ON p.id = m_resp.process_id ";
        }
        if (!empty($where_clauses)) {
            $count_sql .= " WHERE " . implode(" AND ", $where_clauses);
        }
        
        $stmt_count = $pdo->prepare($count_sql);
        $param_index = 1;
        foreach ($params as $param) {
            $stmt_count->bindValue($param_index++, $param, is_int($param) ? PDO::PARAM_INT : PDO::PARAM_STR);
        }
        $stmt_count->execute();
        $total_items = (int)$stmt_count->fetchColumn();
        
        // Final Query Execution
        $sql .= " LIMIT ? OFFSET ?";
        $params[] = $limit;
        $params[] = $offset;
        
        $stmt = $pdo->prepare($sql);
        $param_index = 1;
        foreach ($params as $param) {
            $stmt->bindValue($param_index++, $param, is_int($param) ? PDO::PARAM_INT : PDO::PARAM_STR);
        }
        $stmt->execute();
        $processes = $stmt->fetchAll();
        
        // Enrich latest movement
        foreach ($processes as &$p) {
            $stmt2 = $pdo->prepare('
                SELECT m.action, m.movement_date, m.destination_sector_id, u.name as user_name, s.name as sector_name, r.name as responsible_name
                FROM movements m
                LEFT JOIN users u ON m.user_id = u.id
                LEFT JOIN sectors s ON m.destination_sector_id = s.id
                LEFT JOIN responsibles r ON m.responsible_id = r.id
                WHERE m.process_id = ? 
                ORDER BY m.movement_date DESC, m.id DESC 
                LIMIT 1
            ');
            $stmt2->execute([$p['id']]);
            $last = $stmt2->fetch();
            $p['action'] = $last ? $last['action'] : 'NOVO';
            $p['movement_date'] = $last ? $last['movement_date'] : null;
            $p['last_destination_sector_id'] = $last ? $last['destination_sector_id'] : null;
            $p['last_sector_name'] = $last ? $last['sector_name'] : '-';
            $p['user_name'] = $last ? $last['user_name'] : '-';
            $p['responsible_name'] = $last && $last['responsible_name'] ? $last['responsible_name'] : 'Não atribuído';
        }
        
        jsonResponse([
            'processes' => $processes,
            'pagination' => [
                'total' => $total_items,
                'page' => $page,
                'limit' => $limit,
                'pages' => ceil($total_items / $limit)
            ]
        ]);
    }
} elseif ($method === 'POST') {
    $data = json_decode(file_get_contents('php://input'), true);
    
    $process_number = trim($data['process_number'] ?? '');
    $subject = trim($data['subject'] ?? '');
    $requester = trim($data['requester'] ?? '');
    $document_number = trim($data['document_number'] ?? '');
    $observations = trim($data['observations'] ?? '');
    
    $movement_date = !empty($data['movement_date']) ? $data['movement_date'] : date('Y-m-d H:i:s');
    $destination_sector_id = $data['destination_sector_id'] ?? null;
    $responsible_id = !empty($data['responsible_id']) ? $data['responsible_id'] : null;
    
    if (empty($process_number)) {
        jsonResponse(['error' => 'Número do processo é obrigatório'], 400);
    }
    
    if (empty($destination_sector_id)) {
        jsonResponse(['error' => 'Setor de destino é obrigatório'], 400);
    }

    $pdo->beginTransaction();
    try {
        $stmt = $pdo->prepare('SELECT id FROM processes WHERE process_number = ?');
        $stmt->execute([$process_number]);
        $process = $stmt->fetch();
        
        $action = 'ENTRADA'; // Ação padrão para novos processos
        
        if ($process) {
            $process_id = $process['id'];
            
            // Buscar o último trâmite para validar posse e calcular a relação hierárquica
            $stmt_check = $pdo->prepare('SELECT destination_sector_id, action FROM movements WHERE process_id = ? ORDER BY movement_date DESC, id DESC LIMIT 1');
            $stmt_check->execute([$process_id]);
            $last_mov = $stmt_check->fetch();
            
            if ($last_mov) {
                // REGRA DE NEGÓCIO: Verificar posse dos setores autorizados (não-admin)
                if ($_SESSION['role'] !== 'Admin') {
                    $auth_sectors = getAuthorizedSectors();
                    if (empty($auth_sectors) || !in_array((int)$last_mov['destination_sector_id'], $auth_sectors)) {
                        $stmt_sec = $pdo->prepare('SELECT name FROM sectors WHERE id = ?');
                        $stmt_sec->execute([$last_mov['destination_sector_id']]);
                        $sec_name = $stmt_sec->fetchColumn() ?: 'outro setor';
                        
                        jsonResponse(['error' => "Este processo não está sob a posse de seus setores autorizados atualmente (está sob custódia de: {$sec_name}). Tramitação não autorizada."], 403);
                    }
                }
                
                // CALCULAR REGRA DE RELACIONAMENTO HIERÁRQUICO AUTOMATICAMENTE
                $current_sector_id = $last_mov['destination_sector_id'];
                
                // Pai do setor atual
                $stmt_cur = $pdo->prepare('SELECT parent_id FROM sectors WHERE id = ?');
                $stmt_cur->execute([$current_sector_id]);
                $cur_parent_id = $stmt_cur->fetchColumn();
                
                // Pai do setor destino
                $stmt_dest = $pdo->prepare('SELECT parent_id FROM sectors WHERE id = ?');
                $stmt_dest->execute([$destination_sector_id]);
                $dest_parent_id = $stmt_dest->fetchColumn();
                
                $is_child = ($dest_parent_id == $current_sector_id);
                $is_sibling = ($cur_parent_id !== null && $dest_parent_id == $cur_parent_id);
                $is_parent = ($destination_sector_id == $cur_parent_id);
                
                if ($is_child || $is_sibling || $is_parent) {
                    $action = 'ENTRADA'; // Tramitação interna na família de setores
                } else {
                    $action = 'SAIDA';   // Setor fora da estrutura direta da família
                }
            }

            // Atualizar as informações gerais do processo na base local
            $stmt = $pdo->prepare('
                UPDATE processes 
                SET subject = ?, requester = ?, document_number = ?, observations = ? 
                WHERE id = ?
            ');
            $stmt->execute([$subject, $requester, $document_number, $observations, $process_id]);
        } else {
            // New process
            $stmt = $pdo->prepare('INSERT INTO processes (process_number, subject, requester, document_number, observations) VALUES (?, ?, ?, ?, ?)');
            $stmt->execute([$process_number, $subject, $requester, $document_number, $observations]);
            $process_id = $pdo->lastInsertId();
        }
        
        // Insert movement
        $stmt = $pdo->prepare('INSERT INTO movements (process_id, movement_date, action, destination_sector_id, responsible_id, user_id) VALUES (?, ?, ?, ?, ?, ?)');
        $stmt->execute([$process_id, $movement_date, $action, $destination_sector_id, $responsible_id, $_SESSION['user_id']]);
        
        // JOINT MOVEMENT: If this process is a parent, move all children too
        $stmt = $pdo->prepare('SELECT id FROM processes WHERE parent_id = ?');
        $stmt->execute([$process_id]);
        $children = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        foreach ($children as $child) {
            $stmt = $pdo->prepare('INSERT INTO movements (process_id, movement_date, action, destination_sector_id, responsible_id, user_id) VALUES (?, ?, ?, ?, ?, ?)');
            $stmt->execute([$child['id'], $movement_date, $action, $destination_sector_id, $responsible_id, $_SESSION['user_id']]);
        }
        
        $pdo->commit();
        jsonResponse(['success' => true]);
    } catch (Exception $e) {
        $pdo->rollBack();
        jsonResponse(['error' => 'Erro interno ao registrar movimentação: '.$e->getMessage()], 500);
    }
} else {
    jsonResponse(['error' => 'Método inválido'], 405);
}
?>
