<?php
require 'config.php';
checkAuth();

header('Content-Type: application/json');

$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'GET') {
    // List recent movements or history of a specific process
    $process_id = $_GET['process_id'] ?? null;
    $process_number = $_GET['process_number'] ?? null;
    
    if ($process_id) {
        $stmt = $pdo->prepare('
            SELECT m.id, m.movement_date, m.action, m.created_at, 
                   s.name as destination_sector, u.name as user_name
            FROM movements m
            JOIN sectors s ON m.destination_sector_id = s.id
            JOIN users u ON m.user_id = u.id
            WHERE m.process_id = ?
            ORDER BY m.movement_date DESC, m.created_at DESC
        ');
        $stmt->execute([$process_id]);
        jsonResponse($stmt->fetchAll());
    } elseif ($process_number) {
        // Fetch process details and last movement
        $stmt = $pdo->prepare('SELECT id, subject, requester, document_number, observations FROM processes WHERE process_number = ?');
        $stmt->execute([$process_number]);
        $process = $stmt->fetch();
        
        if ($process) {
            // Get last movement
            $stmt = $pdo->prepare('SELECT action FROM movements WHERE process_id = ? ORDER BY movement_date DESC, created_at DESC LIMIT 1');
            $stmt->execute([$process['id']]);
            $last_movement = $stmt->fetch();
            
            $process['last_action'] = $last_movement ? $last_movement['action'] : null;
            jsonResponse($process);
        } else {
            jsonResponse(null);
        }
    } else {
        // List all recent movements
        $stmt = $pdo->query('
            SELECT m.id, p.process_number, p.subject, m.movement_date, m.action, 
                   s.name as destination_sector, u.name as user_name
            FROM movements m
            JOIN processes p ON m.process_id = p.id
            JOIN sectors s ON m.destination_sector_id = s.id
            JOIN users u ON m.user_id = u.id
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
    
    $movement_date = $data['movement_date'] ?? date('Y-m-d');
    $action = $data['action'] ?? ''; // ENTRADA or SAIDA
    $destination_sector_id = $data['destination_sector_id'] ?? null;
    
    if (empty($process_number) || empty($action)) {
        jsonResponse(['error' => 'Número do processo e Ação são obrigatórios'], 400);
    }
    
    // If ENTRADA, force destination to SUBFIS
    if ($action === 'ENTRADA') {
        $stmt = $pdo->prepare('SELECT id FROM sectors WHERE name = "SUBFIS" LIMIT 1');
        $stmt->execute();
        $subfis = $stmt->fetch();
        if (!$subfis) {
            jsonResponse(['error' => 'Setor padrão SUBFIS não encontrado no banco'], 500);
        }
        $destination_sector_id = $subfis['id'];
    } elseif ($action === 'SAIDA' && empty($destination_sector_id)) {
        jsonResponse(['error' => 'Setor de destino é obrigatório para SAÍDA'], 400);
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
            if (empty($subject) || empty($requester)) {
                $pdo->rollBack();
                jsonResponse(['error' => 'Assunto e Requerente são obrigatórios para um novo processo'], 400);
            }
            $stmt = $pdo->prepare('INSERT INTO processes (process_number, subject, requester, document_number, observations) VALUES (?, ?, ?, ?, ?)');
            $stmt->execute([$process_number, $subject, $requester, $document_number, $observations]);
            $process_id = $pdo->lastInsertId();
        }
        
        // Insert movement
        $stmt = $pdo->prepare('INSERT INTO movements (process_id, movement_date, action, destination_sector_id, user_id) VALUES (?, ?, ?, ?, ?)');
        $stmt->execute([$process_id, $movement_date, $action, $destination_sector_id, $_SESSION['user_id']]);
        
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
