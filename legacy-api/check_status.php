<?php
header('Content-Type: application/json');
require_once '../includes/db.php';

$ref = $_GET['ref'] ?? '';

if (!$ref) {
    echo json_encode(['success' => false, 'message' => 'Missing reference.']);
    exit();
}

$stmt = $pdo->prepare("SELECT id, status as payment_status FROM payments WHERE reference_id = ?");
$stmt->execute([$ref]);
$payment = $stmt->fetch();

if ($payment) {
    $response = [
        'success' => true,
        'payment_status' => $payment['payment_status'],
        'reg_status' => null,
        'bib_number' => null
    ];

    // Try to get bib if it's a marathon reg
    $reg = $pdo->prepare("SELECT status, bib_number FROM registrations WHERE payment_id = ?");
    $reg->execute([$payment['id']]);
    $regData = $reg->fetch();
    
    if ($regData) {
        $response['reg_status'] = $regData['status'];
        $response['bib_number'] = $regData['bib_number'];
    }

    echo json_encode($response);
} else {
    echo json_encode(['success' => false, 'message' => 'Reference not found.']);
}
?>
