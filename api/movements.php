<?php
require 'config.php';
checkAuth();

header('Content-Type: application/json');

$method = $_SERVER['REQUEST_METHOD'];

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
                   (SELECT COUNT(*) FROM processes WHERE parent_id = p.id) as attachments_count,
                   (SELECT process_number FROM processes WHERE id = p.parent_id) as parent_process_number,
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
            SELECT id, subject, requester, document_number, observations, parent_id,
                   (SELECT COUNT(*) FROM processes WHERE parent_id = processes.id) as attachments_count,
                   (SELECT process_number FROM processes p2 WHERE p2.id = processes.parent_id) as parent_process_number
            FROM processes 
            WHERE process_number = ?
        ');
        $stmt->execute([$process_number]);
        $process = $stmt->fetch();
        
        if ($process) {
            // Get last movement and its sector info
            $stmt = $pdo->prepare('
                SELECT m.action, s.is_internal as sector_is_internal, m.responsible_id
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
            jsonResponse(['exists' => true, 'process' => $process]);
        } else {
            jsonResponse(['exists' => false]);
        }
    } elseif (isset($_GET['search']) || isset($_GET['sector_id'])) {
        $search = $_GET['search'] ?? '';
        $sector_id = $_GET['sector_id'] ?? null;
        $only_current = isset($_GET['only_current']) && $_GET['only_current'] === '1';
        
        $params = [];
        $sql = "SELECT DISTINCT p.id, p.process_number, p.subject, p.requester, p.parent_id,
                (SELECT COUNT(*) FROM processes WHERE parent_id = p.id) as attachments_count,
                (SELECT process_number FROM processes WHERE id = p.parent_id) as parent_process_number 
                FROM processes p ";
        
        if ($only_current && $sector_id) {
            $sql .= "
                JOIN movements m ON p.id = m.process_id 
                WHERE m.id IN (SELECT MAX(id) FROM movements GROUP BY process_id)
                AND m.destination_sector_id = ?
            ";
            $params[] = $sector_id;
            if ($search) {
                $sql .= " AND p.process_number LIKE ?";
                $params[] = '%'.$search.'%';
            }
        } elseif ($sector_id) {
            $sql .= "
                JOIN movements m ON p.id = m.process_id 
                WHERE m.destination_sector_id = ?
            ";
            $params[] = $sector_id;
            if ($search) {
                $sql .= " AND p.process_number LIKE ?";
                $params[] = '%'.$search.'%';
            }
        } else {
            $sql .= " WHERE p.process_number LIKE ?";
            $params[] = '%'.$search.'%';
        }
        
        $sql .= " ORDER BY p.id DESC LIMIT 50";
        
        $stmt = $pdo->prepare($sql);
        $stmt->execute($params);
        $processes = $stmt->fetchAll();
        
        foreach ($processes as &$p) {
            $stmt2 = $pdo->prepare('SELECT action, movement_date FROM movements WHERE process_id = ? ORDER BY movement_date DESC, id DESC LIMIT 1');
            $stmt2->execute([$p['id']]);
            $last = $stmt2->fetch();
            $p['action'] = $last ? $last['action'] : 'NOVO';
            $p['movement_date'] = $last ? $last['movement_date'] : null;
        }
        jsonResponse($processes);
    } else {
        // List all recent movements
        $stmt = $pdo->query('
            SELECT m.id, p.process_number, p.subject, m.movement_date, m.action, 
                   p.parent_id,
                   (SELECT COUNT(*) FROM processes WHERE parent_id = p.id) as attachments_count,
                   (SELECT process_number FROM processes WHERE id = p.parent_id) as parent_process_number,
                   s.name as destination_sector, u.name as user_name,
                   r.name as responsible_name
            FROM movements m
            JOIN processes p ON m.process_id = p.id
            JOIN sectors s ON m.destination_sector_id = s.id
            JOIN users u ON m.user_id = u.id
            LEFT JOIN responsibles r ON m.responsible_id = r.id
            ORDER BY m.movement_date DESC, m.created_at DESC
            LIMIT 500
        ');
        jsonResponse($stmt->fetchAll());
    }
} elseif ($method === 'POST') {
    $data = json_decode(file_get_contents('php://input'), true);
    
    $process_number = trim($data['process_number'] ?? '');
    $subject = trim($data['subject'] ?? '');
    $requester = trim($data['requester'] ?? '');
    $document_number = trim($data['document_number'] ?? '');
    $observations = trim($data['observations'] ?? '');
    
    $movement_date = !empty($data['movement_date']) ? $data['movement_date'] : date('Y-m-d H:i:s');
    $action = $data['action'] ?? ''; // ENTRADA or SAIDA
    $destination_sector_id = $data['destination_sector_id'] ?? null;
    $responsible_id = !empty($data['responsible_id']) ? $data['responsible_id'] : null;
    
    if (empty($process_number) || empty($action)) {
        jsonResponse(['error' => 'Número do processo e Ação são obrigatórios'], 400);
    }
    
    if (empty($destination_sector_id)) {
        jsonResponse(['error' => 'Setor de destino é obrigatório'], 400);
    }

    $pdo->beginTransaction();
    try {
        $stmt = $pdo->prepare('SELECT id FROM processes WHERE process_number = ?');
        $stmt->execute([$process_number]);
        $process = $stmt->fetch();
        
        $process_id = null;
        if ($process) {
            $process_id = $process['id'];
            // Optionally update observations if provided
            if (!empty($observations)) {
                $stmt = $pdo->prepare('UPDATE processes SET observations = ? WHERE id = ?');
                $stmt->execute([$observations, $process_id]);
            }
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
