<?php
// Aumentar limites do PHP para lidar com grandes planilhas
ini_set('memory_limit', '1024M');
ini_set('max_execution_time', '600'); 
ini_set('display_errors', 0);
error_reporting(E_ALL);

require 'config.php';

header('Content-Type: application/json');

// Catch fatal errors to output JSON
register_shutdown_function(function() {
    $error = error_get_last();
    if ($error !== null && in_array($error['type'], [E_ERROR, E_PARSE, E_CORE_ERROR, E_COMPILE_ERROR])) {
        http_response_code(500);
        echo json_encode(['error' => 'Fatal Error: ' . $error['message'] . ' in ' . $error['file'] . ':' . $error['line']]);
        exit;
    }
});

if (!isset($_SESSION['user_id'])) {
    jsonResponse(['error' => 'Unauthorized'], 401);
}

$method = $_SERVER['REQUEST_METHOD'];
$action = $_GET['action'] ?? '';

// GET History
if ($method === 'GET' && $action === 'history') {
    $stmt = $pdo->query("
        SELECT 
            m.import_batch as id, 
            MAX(m.created_at) as date,
            COUNT(DISTINCT m.id) as movements_count,
            COUNT(DISTINCT p.id) as processes_count
        FROM movements m
        LEFT JOIN processes p ON m.process_id = p.id AND p.import_batch = m.import_batch
        WHERE m.import_batch IS NOT NULL
        GROUP BY m.import_batch
        ORDER BY date DESC
    ");
    $history = $stmt->fetchAll();
    jsonResponse($history);
}

// POST Import
if ($method === 'POST') {
    $data = json_decode(file_get_contents('php://input'), true);
    if (!is_array($data)) {
        jsonResponse(['error' => 'Formato de dados inválido.'], 400);
    }

    $batch_id = $_GET['batch_id'] ?? uniqid('imp_');
    $user_id = $_SESSION['user_id'];

    try {
        $pdo->beginTransaction();

        $stats = [
            'sectors_created' => 0,
            'responsibles_created' => 0,
            'processes_created' => 0,
            'movements_created' => 0
        ];

        $sectorsCache = []; 
        $responsiblesCache = [];
        $processesCache = [];

        // Preload caches with strict lowercasing and trimming
        $stmt = $pdo->query("SELECT id, name FROM sectors");
        foreach($stmt->fetchAll() as $s) {
            $sectorsCache[strtolower(trim($s['name']))] = $s['id'];
        }

        $stmt = $pdo->query("SELECT id, name FROM responsibles");
        foreach($stmt->fetchAll() as $r) {
            $responsiblesCache[strtolower(trim($r['name']))] = $r['id'];
        }
        // Track which (responsible_id, sector_id) links already exist
        $respSectorCache = [];
        $stmt = $pdo->query("SELECT responsible_id, sector_id FROM responsible_sectors");
        foreach($stmt->fetchAll() as $rs) {
            $respSectorCache[$rs['responsible_id'] . '_' . $rs['sector_id']] = true;
        }
        
        $stmt = $pdo->query("SELECT id, process_number FROM processes");
        foreach($stmt->fetchAll() as $p) {
            $processesCache[strtolower(trim($p['process_number']))] = $p['id'];
        }

        // Helper: returns true if the sector name is clearly garbage/data-entry error
        $isInvalidSector = function(string $name): bool {
            if (empty($name)) return true;
            // Only whitespace
            if (trim($name) === '') return true;
            // Isolated punctuation (e.g. ",", ".", "-", "/")
            if (preg_match('/^[\s,\.\-\/]+$/', $name)) return true;
            // Looks like a process number: contains digit + slash (e.g. "009/001074/26", "0")
            if (preg_match('/\d+\//', $name)) return true;
            // Pure number or number with slashes/dashes only
            if (preg_match('/^[\d\/\-\.\s]+$/', $name)) return true;
            // Too short to be meaningful (1 char)
            if (strlen(trim($name)) <= 1) return true;
            return false;
        };

        foreach ($data as $row) {
            // Limpeza robusta (remove espaços invisíveis e afins)
            $process_number = trim(preg_replace('/\s+/', ' ', $row['process_number'] ?? ''));
            $movement_date = !empty($row['movement_date']) ? $row['movement_date'] : date('Y-m-d');
            
            $mov_action_raw = trim($row['action'] ?? 'ENTRADA');
            
            if (preg_match('/SA[IÍ]/iu', $mov_action_raw)) {
                $mov_action = 'SAIDA';
            } elseif (preg_match('/REDISTRI/iu', $mov_action_raw)) {
                $mov_action = 'REDISTRIBUIÇÃO';
            } else {
                $mov_action = 'ENTRADA';
            }

            $responsible_name = trim(preg_replace('/\s+/', ' ', $row['responsible'] ?? ''));
            $subject = trim($row['subject'] ?? 'Processo Importado');
            $sector_raw = trim(preg_replace('/\s+/', ' ', $row['destination_sector'] ?? ''));

            // Sanitize sector: if it looks like a data-entry error, fall back to SUBFIS
            $sector_name = $isInvalidSector($sector_raw) ? 'SUBFIS' : $sector_raw;

            if (empty($process_number)) continue;

            // 1. Sector
            $s_key = strtolower($sector_name);
            if (!isset($sectorsCache[$s_key])) {
                $stmt = $pdo->prepare("INSERT INTO sectors (name, import_batch) VALUES (?, ?)");
                $stmt->execute([$sector_name, $batch_id]);
                $sectorsCache[$s_key] = $pdo->lastInsertId();
                $stats['sectors_created']++;
            }
            $current_sector_id = $sectorsCache[$s_key];

            // 2. Responsible — lookup by name only, link to sector via pivot table
            $resp_id = null;
            if (!empty($responsible_name)) {
                $r_key = strtolower($responsible_name);
                if (!isset($responsiblesCache[$r_key])) {
                    // New auditor: create with current sector
                    $stmt = $pdo->prepare("INSERT INTO responsibles (name, sector_id, import_batch) VALUES (?, ?, ?)");
                    $stmt->execute([$responsible_name, $current_sector_id, $batch_id]);
                    $resp_id = $pdo->lastInsertId();
                    $responsiblesCache[$r_key] = $resp_id;
                    $stats['responsibles_created']++;
                } else {
                    $resp_id = $responsiblesCache[$r_key];
                }

                // Link auditor to sector if not already linked (via responsible_sectors)
                $rs_key = $resp_id . '_' . $current_sector_id;
                if (!isset($respSectorCache[$rs_key])) {
                    $stmt = $pdo->prepare("INSERT IGNORE INTO responsible_sectors (responsible_id, sector_id) VALUES (?, ?)");
                    $stmt->execute([$resp_id, $current_sector_id]);
                    $respSectorCache[$rs_key] = true;
                }
            }

            // 3. Process
            $p_key = strtolower($process_number);
            if (!isset($processesCache[$p_key])) {
                $stmt = $pdo->prepare("INSERT INTO processes (process_number, subject, requester, import_batch) VALUES (?, ?, ?, ?)");
                $stmt->execute([$process_number, $subject, 'Importação de Dados', $batch_id]);
                $processesCache[$p_key] = $pdo->lastInsertId();
                $stats['processes_created']++;
            }
            $current_process_id = $processesCache[$p_key];

            // 4. Movement
            $stmt = $pdo->prepare("INSERT INTO movements (process_id, movement_date, action, destination_sector_id, responsible_id, user_id, import_batch) VALUES (?, ?, ?, ?, ?, ?, ?)");
            $stmt->execute([
                $current_process_id,
                $movement_date,
                $mov_action,
                $current_sector_id,
                $resp_id,
                $user_id,
                $batch_id
            ]);
            $stats['movements_created']++;
        }

        $pdo->commit();
        jsonResponse([
            'success' => true,
            'batch_id' => $batch_id,
            'stats' => $stats
        ]);

    } catch (Exception $e) {
        $pdo->rollBack();
        jsonResponse(['error' => 'Falha na importação: ' . $e->getMessage()], 500);
    }
}

// DELETE (Undo)
if ($method === 'DELETE') {
    $batch_id = $_GET['batch'] ?? '';
    if (empty($batch_id)) {
        jsonResponse(['error' => 'Lote não informado'], 400);
    }

    try {
        $pdo->beginTransaction();
        
        $stmt = $pdo->prepare("DELETE FROM movements WHERE import_batch = ?");
        $stmt->execute([$batch_id]);

        $stmt = $pdo->prepare("DELETE FROM processes WHERE import_batch = ?");
        $stmt->execute([$batch_id]);

        $stmt = $pdo->prepare("DELETE FROM responsibles WHERE import_batch = ?");
        $stmt->execute([$batch_id]);

        $stmt = $pdo->prepare("DELETE FROM sectors WHERE import_batch = ?");
        $stmt->execute([$batch_id]);

        $pdo->commit();
        jsonResponse(['success' => true]);
    } catch (Exception $e) {
        $pdo->rollBack();
        jsonResponse(['error' => 'Falha ao desfazer: ' . $e->getMessage()], 500);
    }
}

jsonResponse(['error' => 'Method not allowed'], 405);
?>
