<?php
// PayHero Kenya Credentials
// Get these from your PayHero dashboard (https://payhero.co.ke/)
define('PAYHERO_API_URL', 'https://backend.payhero.co.ke/api/v2/payments');
define('PAYHERO_API_KEY', 'YOUR_API_KEY_HERE'); // USER needs to replace this
define('PAYHERO_USERNAME', 'YOUR_USERNAME_HERE'); // USER needs to replace this
define('PAYHERO_PASSWORD', 'YOUR_PASSWORD_HERE'); // USER needs to replace this
define('PAYHERO_CHANNEL_ID', 'YOUR_CHANNEL_ID_HERE'); // E.g. M-Pesa STK

// Our callback URL (Must be publicly accessible)
define('PAYMENT_CALLBACK_URL', 'https://' . $_SERVER['HTTP_HOST'] . '/api/payment_callback.php');
?>
