<?php
require_once __DIR__ . '/../api/config.php';

try {
    $pdo = new PDO("mysql:host=127.0.0.1;dbname=subfisproc;charset=utf8mb4", "root", "tsuk4Sh");
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

    // 1. Resetar todos para externos
    $pdo->exec("UPDATE sectors SET is_internal = 0");

    // 2. Marcar setores internos
    $internal_patterns = [
        'SUBFIS%', 'AFT%', 'GRAMU%', 'IPTU%', 'ISS%', 'Administrativo%', 
        'Alvar%', 'Cadeia%', 'Núcleo%', 'Dívida%', 'Bancos%', 
        'ITBI%', 'Hospitais%', 'Simples%'
    ];

    $stmt = $pdo->prepare("UPDATE sectors SET is_internal = 1 WHERE name LIKE ? OR alias LIKE ?");
    foreach ($internal_patterns as $pattern) {
        $stmt->execute([$pattern, $pattern]);
    }

    // 3. Corrigir codificação
    $fixes = [
        'NÃºcelo' => 'Núcleo', 'DÃvida' => 'Dívida', 'FiscalizaÃ§Ã£o' => 'Fiscalização',
        'AlvarÃ¡' => 'Alvará', 'MÃ©dica' => 'Médica', 'Ã rea' => 'Área',
        'Ã©' => 'é', 'Ã¡' => 'á', 'Ã³' => 'ó', 'Ãº' => 'ú', 'Ãª' => 'ê',
        'Ã´' => 'ô', 'Ã£' => 'ã', 'Ã§' => 'ç', 'Ã ' => 'Í', 'Ã€' => 'À',
        'ValÃ©ria' => 'Valéria', 'AntÃ´nio' => 'Antônio'
    ];

    foreach ($fixes as $bad => $good) {
        $pdo->prepare("UPDATE sectors SET name = REPLACE(name, ?, ?), alias = REPLACE(alias, ?, ?)")->execute([$bad, $good, $bad, $good]);
        $pdo->prepare("UPDATE responsibles SET name = REPLACE(name, ?, ?)")->execute([$bad, $good]);
        $pdo->prepare("UPDATE users SET name = REPLACE(name, ?, ?)")->execute([$bad, $good]);
    }

    echo "Sucesso! Setores, Responsáveis e Usuários corrigidos localmente.\n";

} catch (Exception $e) {
    echo "Erro: " . $e->getMessage() . "\n";
}
