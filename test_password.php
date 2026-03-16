<?php
$password = 'tsuk4Sh12@';
$hash = '$2y$10$vPZtVzF/j9P8jFh7P5QhG.xG/G9xR1sKkZ68J4FmYqDkY8H/V4Lhe';

if (password_verify($password, $hash)) {
    echo "Password matches!";
} else {
    echo "Password DOES NOT match!";
}
?>
