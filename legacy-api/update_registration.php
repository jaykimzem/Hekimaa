<?php
header('Content-Type: application/json');
require_once '../includes/db.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    echo json_encode(['success' => false, 'message' => 'Invalid request method.']);
    exit();
}

$data = $_POST;

if (empty($data['phone']) || empty($data['first_name']) || empty($data['last_name'])) {
    echo json_encode(['success' => false, 'message' => 'Required profile fields are missing.']);
    exit();
}

try {
    $pdo->beginTransaction();

    // 1. Update User Details (found by phone)
    $stmt = $pdo->prepare("UPDATE users SET 
        first_name = ?, 
        last_name = ?, 
        email = ?, 
        date_of_birth = ?, 
        gender = ?, 
        id_number = ? 
        WHERE phone = ?");
    
    $stmt->execute([
        $data['first_name'], 
        $data['last_name'], 
        $data['email'] ?? null, 
        $data['date_of_birth'] ?? null, 
        $data['gender'] ?? null, 
        $data['id_number'] ?? null,
        $data['phone']
    ]);

    // 2. Update Registration Details
    // Find the latest registration for this user
    $regStmt = $pdo->prepare("SELECT r.id FROM registrations r JOIN users u ON r.user_id = u.id WHERE u.phone = ? ORDER BY r.id DESC LIMIT 1");
    $regStmt->execute([$data['phone']]);
    $reg_id = $regStmt->fetchColumn();

    if ($reg_id) {
        $updReg = $pdo->prepare("UPDATE registrations SET tshirt_size = ? WHERE id = ?");
        $updReg->execute([$data['tshirt_size'] ?? 'M', $reg_id]);
    }

    $pdo->commit();
    echo json_encode(['success' => true, 'message' => 'Profile updated successfully.']);

} catch (Exception $e) {
    $pdo->rollBack();
    echo json_encode(['success' => false, 'message' => 'Update failed: ' . $e->getMessage()]);
}
?>
