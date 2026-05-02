<?php
header('Content-Type: application/json');
require_once '../includes/db.php';
require_once '../includes/helpers.php';

// Log the raw callback for debugging
$raw_data = file_get_contents('php://input');
file_put_contents('../logs/callback_' . time() . '.json', $raw_data);

$data = json_decode($raw_data, true);

if (!$data) {
    echo json_encode(['success' => false, 'message' => 'No data received.']);
    exit();
}

/* 
Expected PayHero Callback Structure (Simplified):
{
    "external_reference": "HEKIMA-XXXX",
    "transaction_id": "MPE8XXXX",
    "status": "Success",
    "amount": 500,
    ...
}
*/

$reference = $data['external_reference'] ?? '';
$status = $data['status'] ?? '';
$transaction_id = $data['transaction_id'] ?? '';

if (!$reference) {
    exit();
}

try {
    $pdo->beginTransaction();

    // 1. Get Payment Record
    $stmt = $pdo->prepare("SELECT * FROM payments WHERE reference_id = ?");
    $stmt->execute([$reference]);
    $payment = $stmt->fetch();

    if ($payment && $payment['status'] == 'pending') {
        if (strtolower($status) == 'success') {
            // Update Payment
            $upd = $pdo->prepare("UPDATE payments SET status = 'success', transaction_id = ?, metadata = ? WHERE id = ?");
            $upd->execute([$transaction_id, $raw_data, $payment['id']]);

            // Get Registration Info
            $regStmt = $pdo->prepare("SELECT r.*, u.gender FROM registrations r JOIN users u ON r.user_id = u.id WHERE r.payment_id = ?");
            $regStmt->execute([$payment['id']]);
            $reg = $regStmt->fetch();

            if ($reg) {
                // Generate BIB
                $bib = generateBibNumber($reg['race_category'], $reg['gender'], $pdo);

                // Confirm Registration
                $conf = $pdo->prepare("UPDATE registrations SET status = 'confirmed', bib_number = ? WHERE id = ?");
                $conf->execute([$bib, $reg['id']]);

                // Log Activity
                $log = $pdo->prepare("INSERT INTO activity_logs (user_id, event_type, description, metadata) VALUES (?, 'payment_success', ?, ?)");
                $log->execute([$payment['user_id'], "Payment successful for reference $reference. BIB #$bib issued.", $raw_data]);
            }
        } else {
            // Update Payment as failed
            $upd = $pdo->prepare("UPDATE payments SET status = 'failed', metadata = ? WHERE id = ?");
            $upd->execute([$raw_data, $payment['id']]);
            
            $log = $pdo->prepare("INSERT INTO activity_logs (user_id, event_type, description, metadata) VALUES (?, 'payment_failed', ?, ?)");
            $log->execute([$payment['user_id'], "Payment failed for reference $reference.", $raw_data]);
        }
    }

    $pdo->commit();
    echo json_encode(['success' => true]);

} catch (Exception $e) {
    $pdo->rollBack();
    file_put_contents('../logs/callback_error.log', $e->getMessage(), FILE_APPEND);
    echo json_encode(['success' => false, 'message' => $e->getMessage()]);
}
?>
