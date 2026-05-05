<?php
// Safaricom Daraja API Credentials
define('MPESA_CONSUMER_KEY', 'jekbXu4J8x6GOoA08VC9LuUsrEgJR2y8Aas7jHMuUXSzIHUi');
define('MPESA_CONSUMER_SECRET', 'GcXJDSLjP3bXofoC8PZY7g86B8WFT3SlvVBtIXFjcQ7GAlTjSLzpiaDhYT4TZ1QH');
define('MPESA_PAYBILL', '614090');
define('MPESA_SHORTCODE', '614090');
define('MPESA_PASSKEY', 'bfb279f9aa9bdbcf158e97dd71a467cd2e0c893059b10f78e6b72ada1ed2c919'); // Default sandbox passkey - USER NEEDS TO PROVIDE PRODUCTION PASSKEY

// Environment: 'sandbox' or 'production'
define('MPESA_ENV', 'production'); 

// URLs based on environment
if (MPESA_ENV === 'production') {
    define('MPESA_AUTH_URL', 'https://api.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials');
    define('MPESA_STK_URL', 'https://api.safaricom.co.ke/mpesa/stkpush/v1/processrequest');
} else {
    define('MPESA_AUTH_URL', 'https://sandbox.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials');
    define('MPESA_STK_URL', 'https://sandbox.safaricom.co.ke/mpesa/stkpush/v1/processrequest');
}

define('MPESA_CALLBACK_URL', 'https://' . $_SERVER['HTTP_HOST'] . '/api/mpesa_callback.php');
?>
