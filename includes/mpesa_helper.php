<?php
require_once 'mpesa_config.php';

class MpesaHelper {
    
    public static function getAccessToken() {
        $credentials = base64_encode(MPESA_CONSUMER_KEY . ':' . MPESA_CONSUMER_SECRET);
        $ch = curl_init(MPESA_AUTH_URL);
        curl_setopt($ch, CURLOPT_HTTPHEADER, ['Authorization: Basic ' . $credentials]);
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);
        $response = curl_exec($ch);
        $result = json_decode($response);
        curl_close($ch);
        return $result->access_token ?? null;
    }

    public static function stkPush($phone, $amount, $reference, $description = 'Hekima Marathon Registration') {
        $token = self::getAccessToken();
        if (!$token) return ['success' => false, 'message' => 'Failed to generate access token.'];

        $timestamp = date('YmdHis');
        $password = base64_encode(MPESA_SHORTCODE . MPESA_PASSKEY . $timestamp);

        // Format phone: 2547XXXXXXXX
        $phone = preg_replace('/[^0-9]/', '', $phone);
        if (strlen($phone) == 10 && substr($phone, 0, 1) == '0') {
            $phone = '254' . substr($phone, 1);
        } elseif (strlen($phone) == 9) {
            $phone = '254' . $phone;
        }

        $payload = [
            'BusinessShortCode' => MPESA_SHORTCODE,
            'Password' => $password,
            'Timestamp' => $timestamp,
            'TransactionType' => 'CustomerPayBillOnline',
            'Amount' => (int)$amount,
            'PartyA' => $phone,
            'PartyB' => MPESA_SHORTCODE,
            'PhoneNumber' => $phone,
            'CallBackURL' => MPESA_CALLBACK_URL,
            'AccountReference' => $reference,
            'TransactionDesc' => $description
        ];

        $ch = curl_init(MPESA_STK_URL);
        curl_setopt($ch, CURLOPT_HTTPHEADER, [
            'Authorization: Bearer ' . $token,
            'Content-Type: application/json'
        ]);
        curl_setopt($ch, CURLOPT_POST, true);
        curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($payload));
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);
        
        $response = curl_exec($ch);
        $err = curl_error($ch);
        curl_close($ch);

        if ($err) {
            return ['success' => false, 'message' => 'CURL Error: ' . $err];
        }

        $result = json_decode($response, true);
        if (isset($result['ResponseCode']) && $result['ResponseCode'] == '0') {
            return ['success' => true, 'message' => 'STK Push initiated successfully.', 'data' => $result];
        } else {
            return ['success' => false, 'message' => $result['errorMessage'] ?? 'STK Push failed.', 'data' => $result];
        }
    }
}
?>
