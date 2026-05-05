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
if (empty($data['phone']) || empty($data['race_category'])) {
    echo json_encode(['success' => false, 'message' => 'Phone and Race Category are required.']);
    exit();
}

$email = $data['email'] ?? null;
$first_name = $data['first_name'] ?? 'Runner';
$last_name = $data['last_name'] ?? time();


try {
    $pdo->beginTransaction();

    // 1. Create or Update User
    $stmt = $pdo->prepare("INSERT INTO users (first_name, last_name, email, phone, date_of_birth, gender, nationality, id_number, county) 
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?) 
        ON DUPLICATE KEY UPDATE first_name=VALUES(first_name), last_name=VALUES(last_name)");
    $stmt->execute([
        $first_name, $last_name, $email, $data['phone'], 
        $data['date_of_birth'] ?? null, $data['gender'] ?? null, $data['nationality'] ?? null, $data['id_number'] ?? null, $data['county'] ?? null
    ]);
    
    $user_id = $pdo->lastInsertId();
    if (!$user_id) {
        $user = $pdo->prepare("SELECT id FROM users WHERE phone = ?");
        $user->execute([$data['phone']]);
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
        require_once '../includes/mpesa_helper.php';
        $stk = MpesaHelper::stkPush($data['phone'], $amount, $reference);
        
        if ($stk['success']) {
            $checkoutID = $stk['data']['CheckoutRequestID'] ?? null;
            if ($checkoutID) {
                $upd = $pdo->prepare("UPDATE payments SET checkout_request_id = ? WHERE id = ?");
                $upd->execute([$checkoutID, $payment_id]);
            }
            $response['message'] = 'STK Push initiated. Please check your phone.';
        } else {
            $response['success'] = false;
            $response['message'] = 'M-Pesa error: ' . $stk['message'];
        }
    } elseif ($payMethod === 'mpesa_manual') {
        $response['message'] = 'Manual payment instructions provided.';
        $response['paybill'] = MPESA_PAYBILL;
    } elseif ($payMethod === 'card') {
        $response['message'] = 'Redirecting to card gateway.';
        $response['redirect_url'] = '#'; 
    }


    $pdo->commit();
    echo json_encode($response);

} catch (Exception $e) {
    $pdo->rollBack();
    echo json_encode(['success' => false, 'message' => 'System error: ' . $e->getMessage()]);
}
?>
