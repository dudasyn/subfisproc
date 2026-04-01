<?php
$process_number = '009/006562/2025';
$url = "http://consultapublica.duquedecaxias.rj.gov.br:8004/consultapublica/index.php?class=ProcProcessoForm";
$cookieFile = sys_get_temp_dir() . '/cookie.txt';

$ch = curl_init();
curl_setopt($ch, CURLOPT_URL, $url);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_COOKIEJAR, $cookieFile);
curl_setopt($ch, CURLOPT_COOKIEFILE, $cookieFile);
curl_setopt($ch, CURLOPT_USERAGENT, "Mozilla/5.0");
curl_setopt($ch, CURLOPT_FOLLOWLOCATION, true);
$html = curl_exec($ch);

$dom = new DOMDocument();
@$dom->loadHTML($html);
$xpath = new DOMXPath($dom);
$inputs = $xpath->query('//form[@id="adianti_form"]//input');

$postData = [];
$processInputName = '';

foreach ($inputs as $input) {
    if ($input->hasAttribute('name')) {
        $name = $input->getAttribute('name');
        $value = $input->getAttribute('value');
        $type = strtolower($input->getAttribute('type'));
        if ($type === 'button') continue;
        
        if (empty($value) && ($type === 'text' || $type === '') && empty($processInputName)) {
            $processInputName = $name;
        } else {
            $postData[$name] = $value;
        }
    }
}

if ($processInputName) {
    echo "Identificou o campo do processo: $processInputName\n";
    $postData[$processInputName] = $process_number;
}

// Simulando o botão de busca
$postData['class'] = 'ProcProcessoForm';
$postData['method'] = 'onConsultar'; 
// Muitas vezes o Adianti usa ajax, vamos simular via POST direto
curl_setopt($ch, CURLOPT_URL, "http://consultapublica.duquedecaxias.rj.gov.br:8004/consultapublica/index.php");
curl_setopt($ch, CURLOPT_POST, true);
curl_setopt($ch, CURLOPT_POSTFIELDS, http_build_query($postData));

$res = curl_exec($ch);
curl_close($ch);

// Vamos tentar ler a resposta
$resDom = new DOMDocument();
@$resDom->loadHTML(stripslashes($res));
$resXpath = new DOMXPath($resDom);

$nodes = [
    'interessado' => "//label[contains(text(), 'Interessado')]/following::input[1]",
    'requerente' => "//label[contains(text(), 'Requerente')]/following::input[1]",
    'assunto' => "//label[contains(text(), 'Complemento do Assunto')]/following::input[1]"
];

$results = [];
foreach ($nodes as $k => $q) {
    $e = $resXpath->query($q);
    if ($e->length > 0) {
        $results[$k] = $e->item(0)->getAttribute('value');
    }
}
print_r($results);

// Se vazio, tenta procurar pelo readonly/div
if (empty(array_filter($results))) {
    echo "Procurando no modo Readonly (div/span)...\n";
    $nodesRO = [
        'interessado' => "//label[contains(text(), 'Interessado')]/following::div[position()=1]",
        'requerente' => "//label[contains(text(), 'Requerente')]/following::div[position()=1]",
        'assunto' => "//label[contains(text(), 'Complemento do Assunto')]/following::div[position()=1]"
    ];
    foreach ($nodesRO as $k => $q) {
        $e = $resXpath->query($q);
        if ($e->length > 0) {
            $results[$k] = trim($e->item(0)->textContent);
        }
    }
    print_r($results);
}

// Imprime um trecho do html se nao achou nada
if (empty(array_filter($results))) {
    echo "Não encontrou nada. Trecho do HTML retornado:\n";
    echo substr($res, 0, 1000) . "...\n";
}
