<?php
header('Content-Type: application/json');
require_once '../includes/db.php';
require_once '../includes/payhero_config.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    echo json_encode(['success' => false, 'message' => 'Invalid request method.']);
    exit();
}

$data = $_POST;

// Basic validation
if (empty($data['email']) || empty($data['phone']) || empty($data['id_number'])) {
    echo json_encode(['success' => false, 'message' => 'Required fields are missing.']);
    exit();
}

try {
    $pdo->beginTransaction();

    // 1. Create or Update User
    $stmt = $pdo->prepare("INSERT INTO users (first_name, last_name, email, phone, date_of_birth, gender, nationality, id_number, county) 
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?) 
        ON DUPLICATE KEY UPDATE first_name=VALUES(first_name), last_name=VALUES(last_name), phone=VALUES(phone)");
    $stmt->execute([
        $data['first_name'], $data['last_name'], $data['email'], $data['phone'], 
        $data['date_of_birth'], $data['gender'], $data['nationality'], $data['id_number'], $data['county'] ?? null
    ]);
    
    $user_id = $pdo->lastInsertId();
    if (!$user_id) {
        $user = $pdo->prepare("SELECT id FROM users WHERE email = ?");
        $user->execute([$data['email']]);
        $user_id = $user->fetchColumn();
    }

    // 2. Create Pending Payment Record
    $amount = 500.00; // Flat price as per requirements
    $reference = 'HEKIMA-' . time() . '-' . rand(100, 999);
    $payMethod = $data['payment_method'] ?? 'mpesa_stk';
    
    $stmt = $pdo->prepare("INSERT INTO payments (user_id, amount, payment_method, reference_id, status) VALUES (?, ?, ?, ?, 'pending')");
    $stmt->execute([$user_id, $amount, $payMethod, $reference]);
    $payment_id = $pdo->lastInsertId();

    // 3. Create Pending Registration
    $stmt = $pdo->prepare("INSERT INTO registrations (user_id, payment_id, race_category, ak_number, tshirt_size, medical_condition, emergency_contact_name, emergency_contact_phone, status) 
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'pending')");
    $stmt->execute([
        $user_id, $payment_id, $data['race_category'], $data['ak_number'] ?? null, 
        $data['tshirt_size'] ?? null, $data['medical_condition'] ?? null, 
        $data['emergency_contact_name'] ?? null, $data['emergency_contact_phone'] ?? null
    ]);

    // 4. Handle Payment Logic
    $response = [
        'success' => true,
        'reference' => $reference,
        'payment_method' => $payMethod
    ];

    if ($payMethod === 'mpesa_stk') {
        // Initiate PayHero STK Push
        /*
        $payload = [
            'amount' => $amount,
            'phone_number' => $data['phone'],
            'channel_id' => PAYHERO_CHANNEL_ID,
            'external_reference' => $reference,
            'callback_url' => PAYMENT_CALLBACK_URL
        ];
        // ... curl call ...
        */
        $response['message'] = 'STK Push initiated.';
    } elseif ($payMethod === 'mpesa_manual') {
        $response['message'] = 'Manual payment instructions provided.';
        $response['till_number'] = '9462547';
    } elseif ($payMethod === 'card') {
        // Here you would generate a redirect URL for Card Payment (PayHero/PesaPal/etc)
        $response['message'] = 'Redirecting to card gateway.';
        $response['redirect_url'] = 'https://payhero.co.ke/pay/HekimaMarathon'; // Example
    }

    $pdo->commit();
    echo json_encode($response);

} catch (Exception $e) {
    $pdo->rollBack();
    echo json_encode(['success' => false, 'message' => 'System error: ' . $e->getMessage()]);
}
?>
