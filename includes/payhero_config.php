<?php
// PayHero Kenya Credentials
// Get these from your PayHero dashboard (https://payhero.co.ke/)
define('PAYHERO_API_URL', 'https://backend.payhero.co.ke/api/v2/payments/stk-push');
define('PAYHERO_USERNAME', 'wXcx7bP6ZRYi3AaaTiPf'); 
define('PAYHERO_PASSWORD', 'lhYXbGJ2Zt2q95ywrhe14EVyDaCZjocLN7SkPvbk'); 
define('PAYHERO_CHANNEL_ID', '7839'); // Account ID used as Channel ID
define('PAYHERO_AUTH_TOKEN', 'Basic d1hjeDdiUDZaUllpM0FhYVRpUGY6bGhZWGJHSjJadDJxOTV5d3JoZTE0RVZ5RGFDWmpvY0xON1NrUHZiaw==');
define('PAYHERO_TILL_NUMBER', '9462547');

// Our callback URL (Must be publicly accessible)
define('PAYMENT_CALLBACK_URL', 'https://' . $_SERVER['HTTP_HOST'] . '/api/payment_callback.php');
?>
