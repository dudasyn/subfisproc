<?php
require 'api/config.php';

$new_hash = '$2y$12$LhnFJaOrIuaodl3oBnKXL.GyRhfzVTsyo.OA2MVX0X4Rkh6nxMOue';
$email = 'admin@subfis.gov';

try {
    $stmt = $pdo->prepare('UPDATE users SET password = ? WHERE email = ?');
    $stmt->execute([$new_hash, $email]);
    echo "Password hash updated successfully in the database!";
} catch (Exception $e) {
    echo "Error updating password: " . $e->getMessage();
}
?>
