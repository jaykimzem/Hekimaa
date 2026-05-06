<?php
header('Content-Type: application/json');
require_once '../includes/db.php';
require_once '../includes/helpers.php';

// Log the raw callback for debugging
$raw_data = file_get_contents('php://input');
file_put_contents('../logs/mpesa_callback_' . time() . '.json', $raw_data);

$data = json_decode($raw_data, true);

if (!isset($data['Body']['stkCallback'])) {
    exit();
}

$callback = $data['Body']['stkCallback'];
$resultCode = $callback['ResultCode'];
$checkoutRequestID = $callback['CheckoutRequestID'];

// Extract Transaction ID (M-Pesa Receipt Number)
$transaction_id = '';
if ($resultCode == 0) {
    if (isset($callback['CallbackMetadata']['Item'])) {
        foreach ($callback['CallbackMetadata']['Item'] as $item) {
            if ($item['Name'] === 'MpesaReceiptNumber') {
                $transaction_id = $item['Value'];
                break;
            }
        }
    }
}

try {
    $pdo->beginTransaction();

    // 1. Check Marathon Payments
    $stmt = $pdo->prepare("SELECT * FROM payments WHERE checkout_request_id = ? AND status = 'pending'");
    $stmt->execute([$checkoutRequestID]);
    $payment = $stmt->fetch();

    if ($payment) {
        if ($resultCode == 0) {
            // Success
            $upd = $pdo->prepare("UPDATE payments SET status = 'success', transaction_id = ?, metadata = ? WHERE id = ?");
            $upd->execute([$transaction_id, $raw_data, $payment['id']]);

            // Confirm Registration
            $regStmt = $pdo->prepare("SELECT r.*, u.gender FROM registrations r JOIN users u ON r.user_id = u.id WHERE r.payment_id = ?");
            $regStmt->execute([$payment['id']]);
            $reg = $regStmt->fetch();

            if ($reg) {
                $bib = generateBibNumber($reg['race_category'], $reg['gender'], $pdo);
                $pdo->prepare("UPDATE registrations SET status = 'confirmed', bib_number = ? WHERE id = ?")
                    ->execute([$bib, $reg['id']]);
            }
        } else {
            // Failed
            $pdo->prepare("UPDATE payments SET status = 'failed', metadata = ? WHERE id = ?")
                ->execute([$raw_data, $payment['id']]);
        }
    } else {
        // 2. Check Karura Registrations
        $kstmt = $pdo->prepare("SELECT * FROM karura_registrations WHERE checkout_request_id = ? AND payment_status = 'pending'");
        $kstmt->execute([$checkoutRequestID]);
        $karura = $kstmt->fetch();

        if ($karura) {
            if ($resultCode == 0) {
                $pdo->prepare("UPDATE karura_registrations SET payment_status = 'success', transaction_id = ? WHERE id = ?")
                    ->execute([$transaction_id, $karura['id']]);
            } else {
                $pdo->prepare("UPDATE karura_registrations SET payment_status = 'failed' WHERE id = ?")
                    ->execute([$karura['id']]);
            }
        }
    }

    $pdo->commit();
    echo json_encode(['ResultCode' => 0, 'ResultDesc' => 'Success']);

} catch (Exception $e) {
    if ($pdo->inTransaction()) $pdo->rollBack();
    file_put_contents('../logs/mpesa_error.log', $e->getMessage(), FILE_APPEND);
    echo json_encode(['ResultCode' => 1, 'ResultDesc' => 'Internal Error']);
}
?>
