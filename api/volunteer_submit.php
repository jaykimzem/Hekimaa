<?php
header('Content-Type: application/json');
require_once '../includes/db.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    exit();
}

$data = $_POST;

try {
    $stmt = $pdo->prepare("INSERT INTO volunteers (full_name, email, phone, category, organization, id_number, residence, transport_assistance, accommodation_assistance, stipend_expectation, stipend_amount) 
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)");
    
    $stmt->execute([
        $data['full_name'],
        $data['email'],
        $data['phone'],
        $data['category'],
        $data['organization'] ?? null,
        $data['id_number'] ?? null,
        $data['residence'] ?? null,
        isset($data['transport_assistance']) ? 1 : 0,
        isset($data['accommodation_assistance']) ? 1 : 0,
        isset($data['stipend_expectation']) ? 1 : 0,
        $data['stipend_amount'] ?? null
    ]);

    // Log activity
    $log = $pdo->prepare("INSERT INTO activity_logs (event_type, description) VALUES ('volunteer_signup', ?)");
    $log->execute(["New volunteer signup: " . $data['full_name']]);

    echo json_encode(['success' => true, 'message' => 'Your volunteer application has been submitted successfully!']);

} catch (Exception $e) {
    echo json_encode(['success' => false, 'message' => 'System error: ' . $e->getMessage()]);
}
?>
