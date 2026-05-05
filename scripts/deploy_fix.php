<?php
/**
 * SCRIPT DE MANUTENÇÃO - EXECUTAR UMA VEZ NO SERVIDOR
 * Este script aplica as correções de banco de dados no ambiente de produção.
 */
require_once __DIR__ . '/../api/config.php';

// Proteção simples: só executa se passar um token ou se você remover esta linha
// if ($_GET['token'] !== 'subfis2026') die('Acesso negado');

try {
    // Usamos as constantes do config.php que já apontam para o banco da Hostinger
    $pdo = new PDO("mysql:host=" . DB_HOST . ";dbname=" . DB_NAME . ";charset=utf8mb4", DB_USER, DB_PASS);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

    echo "<h1>Iniciando Manutenção do Banco de Dados</h1>";

    // 1. Corrigir Categorização de Setores
    echo "<li>Classificando setores internos... ";
    $internal_patterns = ['SUBFIS%', 'AFT%', 'GRAMU%', 'IPTU%', 'ISS%', 'Administrativo%', 'Alvar%', 'Cadeia%', 'Núcleo%', 'Dívida%', 'Bancos%', 'ITBI%', 'Hospitais%', 'Simples%', 'Auditoria%', 'Fiscalização%'];
    $pdo->exec("UPDATE sectors SET is_internal = 0");
    $stmt = $pdo->prepare("UPDATE sectors SET is_internal = 1 WHERE name LIKE ? OR alias LIKE ?");
    foreach ($internal_patterns as $p) { $stmt->execute([$p, $p]); }
    echo "OK!</li>";

    // 2. Corrigir Codificação de Nomes
    echo "<li>Corrigindo acentuação (Sectores, Responsáveis e Usuários)... ";
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
    echo "OK!</li>";

    // 3. Reclassificar Saídas Históricas
    echo "<li>Reclassificando Entradas e Saídas baseadas nos novos setores... ";
    $s1 = $pdo->exec("UPDATE movements m JOIN sectors s ON m.destination_sector_id = s.id SET m.action = 'SAIDA' WHERE s.is_internal = 0");
    $s2 = $pdo->exec("UPDATE movements m JOIN sectors s ON m.destination_sector_id = s.id SET m.action = 'ENTRADA' WHERE s.is_internal = 1");
    echo "OK! ($s1 saídas e $s2 entradas ajustadas)</li>";

    echo "<h2 style='color:green'>MANUTENÇÃO CONCLUÍDA COM SUCESSO!</h2>";
    echo "<p>Por favor, remova este arquivo do servidor por segurança.</p>";

} catch (Exception $e) {
    echo "<h2 style='color:red'>ERRO: " . $e->getMessage() . "</h2>";
}
