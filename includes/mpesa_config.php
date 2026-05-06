<?php
// Safaricom Daraja API Credentials
define('MPESA_CONSUMER_KEY', 'AOzHQg79Scm1xk2oN0mHeQBAAMRb4cctuTf9yczXmeUvLS60');
define('MPESA_CONSUMER_SECRET', 'NxhEtNzhwIdLS1fNsv31Hqw6AOiiF6ylhG2ZYtHlS8RAY9cmO0OwvDaRDACi6G6j');
define('MPESA_PAYBILL', '614090');
define('MPESA_SHORTCODE', '614090');
define('MPESA_PASSKEY', 'b36c58bb7615e3a4301796f6ef98600129f399eeded62805e2d37e8f06829635');

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
