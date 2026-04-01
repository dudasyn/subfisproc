<?php
$process_number = '009/006562/2025';
$url_base = "http://consultapublica.duquedecaxias.rj.gov.br:8004/consultapublica/";
$url_form = $url_base . "index.php?class=ProcProcessoForm";
$url_engine = $url_base . "engine.php?class=ProcProcessoFormConsultar&method=onEdit";

echo "1. Iniciando Sessão...\n";
$ch = curl_init();
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_COOKIEJAR, "");
curl_setopt($ch, CURLOPT_COOKIEFILE, "");
curl_setopt($ch, CURLOPT_USERAGENT, "Mozilla/5.0");
curl_setopt($ch, CURLOPT_FOLLOWLOCATION, true);
curl_setopt($ch, CURLOPT_URL, $url_form);
curl_exec($ch);

echo "2. Consultando Processo: $process_number...\n";
$postData = [
    'current_tab' => '',
    'NUM_PROCESSO' => $process_number,
    'NOM_INTERESSADO' => 'NULL',
    'NOM_REQUERENTE' => 'NULL',
    'fk_COD_ASSUNTO_DES_ASSUNTO' => 'NULL',
    'compl_assunto' => 'NULL',
    'fk_COD_SITUACAO_DES_SITUACAO' => 'NULL'
];

curl_setopt($ch, CURLOPT_URL, $url_engine);
curl_setopt($ch, CURLOPT_POST, true);
curl_setopt($ch, CURLOPT_POSTFIELDS, http_build_query($postData));
curl_setopt($ch, CURLOPT_HTTPHEADER, ['X-Requested-With: XMLHttpRequest']);

$res = curl_exec($ch);
curl_close($ch);

$clean_html = stripslashes($res);
$dom = new DOMDocument();
@$dom->loadHTML('<?xml encoding="utf-8" ?>' . $clean_html);
$xpath = new DOMXPath($dom);

$scraped_data = [];
$queries = [
    'interessado' => "//label[contains(text(), 'Interessado')]/following::input[1]/@value",
    'requerente' => "//label[contains(text(), 'Requerente')]/following::input[1]/@value",
    'assunto' => "//label[contains(text(), 'Complemento do Assunto')]/following::input[1]/@value"
];

foreach ($queries as $key => $q) {
    $elements = $xpath->query($q);
    if ($elements->length > 0) {
        $scraped_data[$key] = $elements->item(0)->nodeValue;
    }
}

echo "DADOS CAPTURADOS:\n";
print_r($scraped_data);

if (empty($scraped_data)) {
    echo "Não capturou nada. Tentando modo div...\n";
    $queriesRO = [
        'interessado' => "//label[contains(text(), 'Interessado')]/following::div[position()=1]",
        'assunto' => "//label[contains(text(), 'Complemento do Assunto')]/following::div[position()=1]"
    ];
    foreach ($queriesRO as $key => $q) {
        $elements = $xpath->query($q);
        if ($elements->length > 0) {
            $scraped_data[$key] = trim($elements->item(0)->textContent);
        }
    }
    print_r($scraped_data);
}
