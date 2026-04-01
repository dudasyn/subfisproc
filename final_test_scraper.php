<?php
$process_number = '009/006562/2025';
$url = "http://consultapublica.duquedecaxias.rj.gov.br:8004/consultapublica/index.php?class=ProcProcessoForm";
$cookieFile = sys_get_temp_dir() . '/cookie_caxias.txt';

echo "1. Acessando página inicial...\n";
$ch = curl_init($url);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_COOKIEJAR, $cookieFile);
curl_setopt($ch, CURLOPT_COOKIEFILE, $cookieFile);
curl_setopt($ch, CURLOPT_USERAGENT, "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36");
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
    echo "   Campo do processo identificado: $processInputName\n";
    $postData[$processInputName] = $process_number;
}

$postData['class'] = 'ProcProcessoForm';
$postData['method'] = 'onSearch';

echo "2. Enviando formulário de busca...\n";
curl_setopt($ch, CURLOPT_URL, "http://consultapublica.duquedecaxias.rj.gov.br:8004/consultapublica/index.php?class=ProcProcessoForm&method=onSearch");
curl_setopt($ch, CURLOPT_POST, true);
curl_setopt($ch, CURLOPT_POSTFIELDS, http_build_query($postData));
$res = curl_exec($ch);
curl_close($ch);

$clean_html = stripslashes($res);
$resDom = new DOMDocument();
@$resDom->loadHTML('<?xml encoding="utf-8" ?>' . $clean_html);
$resXpath = new DOMXPath($resDom);

$queries = [
    'interessado' => [
        "//label[contains(text(), 'Interessado')]/following::input[1]/@value",
        "//label[contains(text(), 'Interessado')]/following::div[position()=1]",
        "//label[contains(text(), 'Interessado')]/following::span[position()=1]"
    ],
    'assunto' => [
        "//label[contains(text(), 'Complemento do Assunto')]/following::input[1]/@value",
        "//label[contains(text(), 'Complemento do Assunto')]/following::div[position()=1]"
    ]
];

$results = [];
foreach ($queries as $key => $xpaths) {
    foreach ($xpaths as $query) {
        $elements = $resXpath->query($query);
        if ($elements->length > 0) {
            $val = $elements->item(0)->nodeValue;
            if (empty($val) && $elements->item(0) instanceof DOMAttr) {
                $val = $elements->item(0)->value;
            }
            if (!empty(trim($val))) {
                $results[$key] = trim($val);
                break;
            }
        }
    }
}

echo "RESULTADOS:\n";
print_r($results);

if (empty(array_filter($results))) {
    echo "AVISO: Nenhum dado capturado. Verificando se retornou erro do Adianti...\n";
    if (strpos($res, 'não encontrado') !== false) {
        echo "   Mensagem: Processo não encontrado.\n";
    } else {
        echo "   Resposta bruta (primeiros 500 chars):\n" . substr($res, 0, 500) . "\n";
    }
}
