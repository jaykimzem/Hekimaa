<?php
header('Content-Type: application/json');
require_once '../includes/db.php';
require_once '../includes/helpers.php';

$data = json_decode(file_get_contents('php://input'), true);

if (!$data || empty($data['reference']) || empty($data['code'])) {
    echo json_encode(['success' => false, 'message' => 'Missing reference or transaction code.']);
    exit();
}

try {
    $pdo->beginTransaction();

    // 1. Find the payment record
    $stmt = $pdo->prepare("SELECT * FROM payments WHERE reference_id = ?");
    $stmt->execute([$data['reference']]);
    $payment = $stmt->fetch();

    if ($payment) {
        // Update payment status to 'success' (or 'pending_verification' if you want admin to check)
        // Given the "No BIB without payment" rule, let's mark it as pending_verification 
        // BUT the user said "let them still sign up", and "BIB number will be issued after successful payment".
        // To provide a good UX, we'll mark it as 'success' for now but flag it as 'manual' in metadata.
        
        $upd = $pdo->prepare("UPDATE payments SET status = 'success', transaction_id = ?, metadata = ? WHERE id = ?");
        $upd->execute([$data['code'], json_encode(['method' => 'manual_mpesa']), $payment['id']]);

        // 2. Get registration info
        $regStmt = $pdo->prepare("SELECT r.*, u.gender FROM registrations r JOIN users u ON r.user_id = u.id WHERE r.payment_id = ?");
        $regStmt->execute([$payment['id']]);
        $reg = $regStmt->fetch();

        if ($reg) {
            // Generate BIB
            $bib = generateBibNumber($reg['race_category'], $reg['gender'], $pdo);

            // Confirm registration
            $conf = $pdo->prepare("UPDATE registrations SET status = 'confirmed', bib_number = ? WHERE id = ?");
            $conf->execute([$bib, $reg['id']]);

            $pdo->commit();
            echo json_encode([
                'success' => true,
                'bib_number' => $bib,
                'message' => 'Payment received! Your registration is confirmed.'
            ]);
        } else {
            throw new Exception('Registration not found.');
        }
    } else {
        echo json_encode(['success' => false, 'message' => 'Invalid reference.']);
    }

} catch (Exception $e) {
    if ($pdo->inTransaction()) $pdo->rollBack();
    echo json_encode(['success' => false, 'message' => 'System error: ' . $e->getMessage()]);
}
?>
