<?php
header('Content-Type: application/json');
require_once '../includes/db.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    exit();
}

$data = $_POST;

try {
    $stmt = $pdo->prepare("INSERT INTO contact_submissions (name, email, subject, message) VALUES (?, ?, ?, ?)");
    
    $subject = isset($data['tier']) ? 'Sponsorship Enquiry: ' . $data['tier'] : ($data['subject'] ?? 'General Enquiry');
    $message = "Phone: " . ($data['phone'] ?? 'N/A') . "\n";
    if (isset($data['organisation'])) $message .= "Organisation: " . $data['organisation'] . "\n";
    if (isset($data['job_title'])) $message .= "Job Title: " . $data['job_title'] . "\n";
    $message .= "\n" . ($data['message'] ?? '');

    $stmt->execute([
        $data['name'],
        $data['email'],
        $subject,
        $message
    ]);

    // Log activity
    $log = $pdo->prepare("INSERT INTO activity_logs (event_type, description) VALUES ('contact_submission', ?)");
    $log->execute(["New contact submission from: " . $data['name']]);

    echo json_encode(['success' => true, 'message' => 'Thank you! Your message has been received.']);

} catch (Exception $e) {
    echo json_encode(['success' => false, 'message' => 'System error: ' . $e->getMessage()]);
}
?>
