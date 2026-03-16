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
} else {
    jsonResponse(['error' => 'Método inválido'], 405);
}
?>
