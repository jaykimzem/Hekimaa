<?php
header('Content-Type: application/json');
require_once '../includes/db.php';

$ref = $_GET['ref'] ?? '';

if (!$ref) {
    echo json_encode(['success' => false, 'message' => 'Missing reference.']);
    exit();
}

$stmt = $pdo->prepare("
    SELECT p.status as payment_status, r.status as reg_status, r.bib_number 
    FROM payments p 
    JOIN registrations r ON r.payment_id = p.id 
    WHERE p.reference_id = ?
");
$stmt->execute([$ref]);
$status = $stmt->fetch();

if ($status) {
    echo json_encode([
        'success' => true,
        'payment_status' => $status['payment_status'],
        'reg_status' => $status['reg_status'],
        'bib_number' => $status['bib_number']
    ]);
} else {
    echo json_encode(['success' => false, 'message' => 'Reference not found.']);
}
?>
