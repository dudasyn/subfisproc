<?php
/**
 * Test Suite: Regra de Custódia de Setor para Trâmite de Processos
 * 
 * Este teste valida a Regra de Negócio:
 * Um usuário só pode registrar movimentações para processos que estão atualmente sob a posse/custódia de seu próprio setor.
 */

// Simular variáveis de ambiente e sessão
if (session_status() === PHP_SESSION_NONE) {
    session_start();
}

// Carregar configuração do banco e funções auxiliares
require_once __DIR__ . '/../api/config.php';

// Cores para saída no terminal CLI
define('ANSI_GREEN', "\033[32m");
define('ANSI_RED', "\033[31m");
define('ANSI_YELLOW', "\033[33m");
define('ANSI_RESET', "\033[0m");

function assertEqual($actual, $expected, $msg) {
    if ($actual === $expected) {
        echo ANSI_GREEN . "  [PASS] " . ANSI_RESET . "$msg\n";
    } else {
        echo ANSI_RED . "  [FAIL] " . ANSI_RESET . "$msg (Esperado: " . var_export($expected, true) . ", Obtido: " . var_export($actual, true) . ")\n";
        exit(1);
    }
}

echo "Iniciando teste unitário integrado da Regra de Custódia de Setor...\n\n";

try {
    // Iniciar uma transação para que o banco não seja alterado de forma permanente
    $pdo->beginTransaction();

    // 1. Criar Setores de Teste
    $stmt = $pdo->prepare("INSERT INTO sectors (name, alias, is_internal, active) VALUES (?, ?, ?, 1)");
    
    // Setor A (Setor do Usuário)
    $stmt->execute(["SETOR DE FISCALIZACAO TESTE A", "SETOR_A", 1]);
    $sectorA_id = $pdo->lastInsertId();
    
    // Setor B (Outro Setor)
    $stmt->execute(["SETOR DE ARQUIVO TESTE B", "SETOR_B", 1]);
    $sectorB_id = $pdo->lastInsertId();

    // 2. Criar Processo de Teste
    $stmt_proc = $pdo->prepare("INSERT INTO processes (process_number, subject, requester) VALUES (?, ?, ?)");
    $process_number = "999/123456/2026";
    $stmt_proc->execute([$process_number, "PROCESSO TESTE CUSTODIA", "REQUERENTE TESTE"]);
    $process_id = $pdo->lastInsertId();

    // 3. Criar Usuário de Teste
    $stmt_user = $pdo->prepare("INSERT INTO users (cpf, name, email, password, role, sector_id, department, active) VALUES (?, ?, ?, ?, ?, ?, ?, 1)");
    $stmt_user->execute(["123.456.789-00", "Usuario Teste A", "teste_a@subfisproc.com", password_hash("123456", PASSWORD_DEFAULT), "Agente", $sectorA_id, "FISCALIZACAO"]);
    $user_id = $pdo->lastInsertId();

    echo "--- Cenário 1: Processo atualmente sob custódia do Setor A (Mesmo setor do usuário) ---\n";
    
    // Registrar movimento inicial direcionando o processo para o Setor A
    $stmt_mov = $pdo->prepare("INSERT INTO movements (process_id, movement_date, action, destination_sector_id, user_id) VALUES (?, NOW(), 'ENTRADA', ?, ?)");
    $stmt_mov->execute([$process_id, $sectorA_id, $user_id]);

    // Simular sessão do usuário logado no Setor A
    $_SESSION['user_id'] = $user_id;
    $_SESSION['sector_id'] = $sectorA_id;

    // Executar verificação da regra de custódia
    $stmt_check = $pdo->prepare('SELECT destination_sector_id, action FROM movements WHERE process_id = ? ORDER BY movement_date DESC, id DESC LIMIT 1');
    $stmt_check->execute([$process_id]);
    $last_mov = $stmt_check->fetch();

    $hasCustody = true;
    $errorMessage = "";
    if ($last_mov) {
        if ($last_mov['destination_sector_id'] != $_SESSION['sector_id']) {
            $hasCustody = false;
            $stmt_sec = $pdo->prepare('SELECT name FROM sectors WHERE id = ?');
            $stmt_sec->execute([$last_mov['destination_sector_id']]);
            $sec_name = $stmt_sec->fetchColumn() ?: 'outro setor';
            $errorMessage = "Este processo não está sob posse do seu setor atualmente (está sob custódia de: {$sec_name}). Tramitação não autorizada.";
        }
    }

    assertEqual($hasCustody, true, "Usuário do Setor A deve ter autorização para movimentar o processo.");
    assertEqual($errorMessage, "", "Nenhuma mensagem de erro deve ser gerada no Cenário 1.");

    echo "\n--- Cenário 2: Processo sob custódia do Setor B (Setor diferente do usuário) ---\n";
    
    // Registrar trâmite direcionando o processo para o Setor B
    $stmt_mov->execute([$process_id, $sectorB_id, $user_id]);

    // Executar verificação da regra de custódia novamente
    $stmt_check->execute([$process_id]);
    $last_mov = $stmt_check->fetch();

    $hasCustody = true;
    $errorMessage = "";
    if ($last_mov) {
        if ($last_mov['destination_sector_id'] != $_SESSION['sector_id']) {
            $hasCustody = false;
            $stmt_sec = $pdo->prepare('SELECT name FROM sectors WHERE id = ?');
            $stmt_sec->execute([$last_mov['destination_sector_id']]);
            $sec_name = $stmt_sec->fetchColumn() ?: 'outro setor';
            $errorMessage = "Este processo não está sob posse do seu setor atualmente (está sob custódia de: {$sec_name}). Tramitação não autorizada.";
        }
    }

    assertEqual($hasCustody, false, "Usuário do Setor A NÃO deve ter autorização para movimentar o processo (custódia está no Setor B).");
    assertEqual($errorMessage, "Este processo não está sob posse do seu setor atualmente (está sob custódia de: SETOR DE ARQUIVO TESTE B). Tramitação não autorizada.", "Deve lançar o erro de custódia correspondente.");

    echo "\n" . ANSI_GREEN . "Todos os testes de validação de custódia foram aprovados com sucesso!" . ANSI_RESET . "\n";

    // Sempre realizar o rollback para manter a integridade do banco de dados intacta!
    $pdo->rollBack();
    echo "Rollback efetuado. Banco de dados limpo com sucesso.\n";

} catch (Exception $e) {
    if (isset($pdo) && $pdo->inTransaction()) {
        $pdo->rollBack();
    }
    echo ANSI_RED . "Erro durante a execução do teste: " . ANSI_RESET . $e->getMessage() . "\n";
    exit(1);
}
