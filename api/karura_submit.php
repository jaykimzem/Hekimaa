<?php
header('Content-Type: application/json');
require_once '../includes/db.php';
require_once '../includes/payhero_config.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    echo json_encode(['success' => false, 'message' => 'Invalid request method.']);
    exit();
}

$type = $_POST['type'] ?? '';

if ($type === 'paid') {
    $names = $_POST['names'] ?? '';
    $phone = $_POST['phone'] ?? '';
    $email = $_POST['email'] ?? '';
    $company = $_POST['company'] ?? '';
    $emergency = $_POST['emergency_contact'] ?? '';

    if (!$names || !$phone || !$email || !$emergency) {
        echo json_encode(['success' => false, 'message' => 'Please fill in all required fields.']);
        exit();
    }

    $amount = 500.00;
    $reference = 'KARURA-' . time() . '-' . rand(100, 999);

    try {
        $pdo->beginTransaction();

        // 1. Create Karura Registration (Pending)
        $stmt = $pdo->prepare("INSERT INTO karura_registrations (names, phone, email, company, emergency_contact, reference) VALUES (?, ?, ?, ?, ?, ?)");
        $stmt->execute([$names, $phone, $email, $company, $emergency, $reference]);
        $karura_id = $pdo->lastInsertId();

        // 2. Create Payment Record (for check_status.php consistency)
        // We need a user_id or handle null. The schema says user_id is NOT NULL.
        // This is a problem because Karura submit doesn't create a user.
        // I'll create a user or use a dummy one, or update schema to allow null user_id.
        // Actually, let's just create/get a user like in register_marathon.php.
        
        $stmt = $pdo->prepare("INSERT INTO users (first_name, last_name, email, phone, id_number) 
            VALUES (?, 'Karura', ?, ?, ?) 
            ON DUPLICATE KEY UPDATE first_name=VALUES(first_name)");
        $stmt->execute([$names, $email, $phone, 'KAR-' . time()]);
        $user_id = $pdo->lastInsertId();
        if (!$user_id) {
            $u = $pdo->prepare("SELECT id FROM users WHERE phone = ?");
            $u->execute([$phone]);
            $user_id = $u->fetchColumn();
        }

        $stmt = $pdo->prepare("INSERT INTO payments (user_id, amount, payment_method, reference_id, status) VALUES (?, ?, 'mpesa_stk', ?, 'pending')");
        $stmt->execute([$user_id, $amount, $reference]);
        $payment_id = $pdo->lastInsertId();

        // Initiate STK Push
        require_once '../includes/mpesa_helper.php';
        $stk = MpesaHelper::stkPush($phone, $amount, $reference, 'Karura Youth Run Registration');

        if ($stk['success']) {
            $checkoutID = $stk['data']['CheckoutRequestID'] ?? null;
            if ($checkoutID) {
                $pdo->prepare("UPDATE payments SET checkout_request_id = ? WHERE id = ?")->execute([$checkoutID, $payment_id]);
                $pdo->prepare("UPDATE karura_registrations SET checkout_request_id = ? WHERE id = ?")->execute([$checkoutID, $karura_id]);
            }
            $pdo->commit();
            echo json_encode(['success' => true, 'message' => 'STK Push initiated. Please check your phone.', 'reference' => $reference]);
        } else {
            $pdo->rollBack();
            echo json_encode(['success' => false, 'message' => 'M-Pesa error: ' . $stk['message']]);
        }

    } catch (Exception $e) {
        if ($pdo->inTransaction()) $pdo->rollBack();
        echo json_encode(['success' => false, 'message' => 'Database error: ' . $e->getMessage()]);
    }

} elseif ($type === 'sponsorship') {
    $names = $_POST['names'] ?? '';
    $phone = $_POST['phone'] ?? '';
    $reg_no = $_POST['reg_no'] ?? '';
    $institution = $_POST['institution'] ?? '';
    $program = $_POST['program'] ?? '';
    $emergency = $_POST['emergency_contact'] ?? '';

    if (!$names || !$phone || !$reg_no || !$institution || !$program || !$emergency) {
        echo json_encode(['success' => false, 'message' => 'Please fill in all required fields.']);
        exit();
    }

    try {
        $stmt = $pdo->prepare("INSERT INTO karura_sponsorships (names, phone, reg_no, institution, program, emergency_contact) VALUES (?, ?, ?, ?, ?, ?)");
        $stmt->execute([$names, $phone, $reg_no, $institution, $program, $emergency]);
        echo json_encode(['success' => true, 'message' => 'Sponsorship request submitted successfully!']);
    } catch (Exception $e) {
        echo json_encode(['success' => false, 'message' => 'Database error: ' . $e->getMessage()]);
    }
} else {
    echo json_encode(['success' => false, 'message' => 'Invalid submission type.']);
}
?>
