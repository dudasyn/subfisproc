<?php
require 'config.php';
// Para teste local via CLI, pode-se comentar a linha abaixo. 
// Em produção, mantenha para segurança.
checkAuth();

header('Content-Type: application/json');

$process_number = $_GET['process'] ?? '';
if (empty($process_number)) {
    jsonResponse(['error' => 'Número do processo não fornecido'], 400);
}

// Limpeza básica para garantir que o formato enviado à prefeitura seja limpo
$process_number = trim($process_number);

$url_base = "http://consultapublica.duquedecaxias.rj.gov.br:8004/consultapublica/";
$url_form = $url_base . "index.php?class=ProcProcessoForm";
$url_engine = $url_base . "engine.php?class=ProcProcessoFormConsultar&method=onEdit";

$ch = curl_init();
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_COOKIEFILE, ""); // Ativa cookies em memória
curl_setopt($ch, CURLOPT_USERAGENT, "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36");
curl_setopt($ch, CURLOPT_FOLLOWLOCATION, true);
curl_setopt($ch, CURLOPT_TIMEOUT, 20);

// 1. Pega a página inicial para iniciar a sessão e obter cookies
curl_setopt($ch, CURLOPT_URL, $url_form);
curl_exec($ch);

// 2. Faz o POST para o engine.php com os parâmetros exatos descobertos via network tracing
$postData = [
    'current_tab' => '',
    'NUM_PROCESSO' => $process_number,
    'NUM_VOLUME' => '',
    'proc_movimento_PROCESSO__row__id' => '',
    'DAT_PROCESSO' => '',
    'NOM_INTERESSADO' => 'NULL',
    'NOM_REQUERENTE' => 'NULL',
    'fk_COD_ASSUNTO_DES_ASSUNTO' => 'NULL',
    'compl_assunto' => 'NULL',
    'fk_COD_SITUACAO_DES_SITUACAO' => 'NULL',
    'OBS_PROCESSO' => ''
];

curl_setopt($ch, CURLOPT_URL, $url_engine);
curl_setopt($ch, CURLOPT_POST, true);
curl_setopt($ch, CURLOPT_POSTFIELDS, http_build_query($postData));
curl_setopt($ch, CURLOPT_HTTPHEADER, [
    'X-Requested-With: XMLHttpRequest',
    'Content-Type: application/x-www-form-urlencoded; charset=UTF-8'
]);

$res = curl_exec($ch);

if (curl_errno($ch)) {
    $error_msg = curl_error($ch);
    $error_code = curl_errno($ch);
    curl_close($ch);
    jsonResponse([
        'success' => false, 
        'message' => "Erro de conexão com o portal (Caxias): $error_msg (Código: $error_code). Isso pode ser causado por bloqueio de porta no servidor."
    ], 500);
}
curl_close($ch);

// 3. Parsea o resultado
// O Adianti retorna um HTML escapado em JSON/XML. stripslashes ajuda a limpar
$clean_html = stripslashes($res);

// Suprimir erros de HTML mal formado
$dom = new DOMDocument();
@$dom->loadHTML('<?xml encoding="utf-8" ?>' . $clean_html);
$xpath = new DOMXPath($dom);

$scraped_data = [
    'interessado' => null,
    'requerente' => null,
    'assunto' => null, // Complemento do Assunto
    'assunto_original' => null, // Assunto principal do portal
    'data_abertura' => null,
    'situacao' => null,
    'observacao' => null,
    'ultima_tramitacao' => null
];

// Mapeamento de consultas XPath exatas usando o atributo "name" dos campos do portal
$queries = [
    'interessado' => "//input[@name='NOM_INTERESSADO']/@value",
    'requerente' => "//input[@name='NOM_REQUERENTE']/@value",
    'assunto_original' => "//input[@name='fk_COD_ASSUNTO_DES_ASSUNTO']/@value",
    'assunto' => "//input[@name='compl_assunto']/@value",
    'data_abertura' => "//input[@name='DAT_PROCESSO']/@value",
    'situacao' => "//input[@name='fk_COD_SITUACAO_DES_SITUACAO']/@value",
    'observacao' => "//textarea[@name='OBS_PROCESSO']/text()"
];

foreach ($queries as $key => $query) {
    $elements = $xpath->query($query);
    if ($elements->length > 0) {
        $val = $elements->item(0)->nodeValue;
        if (empty($val) && $elements->item(0) instanceof DOMAttr) {
            $val = $elements->item(0)->value;
        }
        if (!empty(trim($val))) {
            $scraped_data[$key] = trim(strip_tags($val));
        }
    }
}

// Se o XPath exato da observação falhar por causa de estrutura do text(), buscamos o nodeValue direto da textarea
if (empty($scraped_data['observacao'])) {
    $obs_nodes = $xpath->query("//textarea[@name='OBS_PROCESSO']");
    if ($obs_nodes->length > 0) {
        $scraped_data['observacao'] = trim(strip_tags($obs_nodes->item(0)->nodeValue));
    }
}

// Se o valor de algum campo ainda estiver nulo ou "NULL" (como o portal costuma enviar), limpamos para string vazia
foreach ($scraped_data as $key => $val) {
    if ($val === 'NULL' || $val === 'null') {
        $scraped_data[$key] = '';
    }
}

// 4. Parsea a tabela de tramitações (proc_movimento_PROCESSO_list)
$rows = $xpath->query("//table[@id='proc_movimento_PROCESSO_list']/tbody/tr");
if ($rows->length > 0) {
    $firstRow = $rows->item(0);
    $tds = $xpath->query("td", $firstRow);
    if ($tds->length >= 7) {
        // Remove espaços duplicados ou quebras de linha que possam vir no texto
        $scraped_data['ultima_tramitacao'] = [
            'data_envio' => trim(preg_replace('/\s+/', ' ', $tds->item(1)->textContent)),
            'secretaria_origem' => trim(preg_replace('/\s+/', ' ', $tds->item(2)->textContent)),
            'setor_origem' => trim(preg_replace('/\s+/', ' ', $tds->item(3)->textContent)),
            'data_recebimento' => trim(preg_replace('/\s+/', ' ', $tds->item(4)->textContent)),
            'secretaria_destino' => trim(preg_replace('/\s+/', ' ', $tds->item(5)->textContent)),
            'setor_destino' => trim(preg_replace('/\s+/', ' ', $tds->item(6)->textContent))
        ];
    }
}

// Se não achamos nada, retornamos erro
if (empty($scraped_data['interessado']) && empty($scraped_data['assunto']) && empty($scraped_data['ultima_tramitacao'])) {
    jsonResponse([
        'success' => false, 
        'message' => 'Processo não encontrado ou sem dados públicos disponíveis'
    ]);
}

jsonResponse([
    'success' => true,
    'data' => $scraped_data
]);
?>
