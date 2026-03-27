<?php
require 'api/config.php';
echo "=== responsibles ===\n";
$r = $pdo->query('DESCRIBE responsibles')->fetchAll();
foreach($r as $col) echo $col['Field'] . ' (' . $col['Type'] . ")\n";
echo "\n=== responsible_sectors ===\n";
$rs = $pdo->query('SHOW TABLES LIKE "responsible_sectors"')->fetchAll();
echo count($rs) > 0 ? "EXISTS\n" : "NOT FOUND\n";
