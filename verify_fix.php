<?php
require 'api/config.php';

$password = 'tsuk4Sh12@';
$email = 'admin@subfis.gov';

try {
    $stmt = $pdo->prepare('SELECT password FROM users WHERE email = ? AND active = 1');
    $stmt->execute([$email]);
    $user = $stmt->fetch();

    if ($user && password_verify($password, $user['password'])) {
        echo "VERIFICATION SUCCESS: Login works with password 'tsuk4Sh12@'!";
    } else {
        echo "VERIFICATION FAILED: Still unable to login!";
    }
} catch (Exception $e) {
    echo "Error during verification: " . $e->getMessage();
}
?>
