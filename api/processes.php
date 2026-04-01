<?php
require 'config.php';
checkAuth(['Admin', 'Gestor']); // Only higher roles can delete

header('Content-Type: application/json');

$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'DELETE') {
    $id = $_GET['id'] ?? 0;
    
    if (!$id) {
        jsonResponse(['error' => 'ID do processo é obrigatório'], 400);
    }

    try {
        $stmt = $pdo->prepare('DELETE FROM processes WHERE id = ?');
        $stmt->execute([$id]);
        
        if ($stmt->rowCount() > 0) {
            jsonResponse(['success' => true]);
        } else {
            jsonResponse(['error' => 'Processo não encontrado'], 404);
        }
    } catch (PDOException $e) {
        jsonResponse(['error' => 'Erro ao excluir processo: ' . $e->getMessage()], 500);
    }
} elseif ($method === 'POST') {
    // Attach or detach
    $data = json_decode(file_get_contents('php://input'), true);
    $action = $data['action'] ?? '';
    
    if ($action === 'attach') {
        $parent_id = $data['parent_id'] ?? null;
        $child_number = trim($data['child_number'] ?? '');
        
        if (!$parent_id || !$child_number) {
            jsonResponse(['error' => 'Pai e Filho são obrigatórios'], 400);
        }

        // Get child ID (or create if not exists)
        $stmt = $pdo->prepare('SELECT id FROM processes WHERE process_number = ?');
        $stmt->execute([$child_number]);
        $child = $stmt->fetch();
        
        if (!$child) {
            // Create a basic process record if it doesn't exist
            $stmt = $pdo->prepare('INSERT INTO processes (process_number, subject, requester) VALUES (?, ?, ?)');
            $stmt->execute([$child_number, 'Processo Apenso', 'Manual (Anexo)']);
            $child_id = $pdo->lastInsertId();
        } else {
            $child_id = $child['id'];
        }

        if ($child_id == $parent_id) {
            jsonResponse(['error' => 'Um processo não pode ser apensado a si mesmo'], 400);
        }

        // Link
        $stmt = $pdo->prepare('UPDATE processes SET parent_id = ? WHERE id = ?');
        $stmt->execute([$parent_id, $child_id]);
        
        jsonResponse(['success' => true]);

    } elseif ($action === 'detach') {
        $child_id = $data['child_id'] ?? null;
        if (!$child_id) {
            jsonResponse(['error' => 'ID do processo é obrigatório'], 400);
        }

        $stmt = $pdo->prepare('UPDATE processes SET parent_id = NULL WHERE id = ?');
        $stmt->execute([$child_id]);
        
        jsonResponse(['success' => true]);
    } else {
        jsonResponse(['error' => 'Ação inválida'], 400);
    }
} else {
    jsonResponse(['error' => 'Método inválido'], 405);
}
?>
