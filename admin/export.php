<?php
session_start();
require_once '../includes/db.php';

if (!isset($_SESSION['admin_id'])) {
    exit('Unauthorized');
}

$type = $_GET['type'] ?? '';

if ($type == 'registrations') {
    header('Content-Type: text/csv');
    header('Content-Disposition: attachment; filename="registrations_' . date('Y-m-d') . '.csv"');

    $output = fopen('php://output', 'w');
    fputcsv($output, ['BIB', 'First Name', 'Last Name', 'Email', 'Phone', 'Race', 'Payment Status', 'Transaction ID', 'Amount', 'Date']);

    $stmt = $pdo->query("
        SELECT r.bib_number, u.first_name, u.last_name, u.email, u.phone, r.race_category, p.status, p.transaction_id, p.amount, r.created_at
        FROM registrations r
        JOIN users u ON r.user_id = u.id
        LEFT JOIN payments p ON r.payment_id = p.id
        ORDER BY r.created_at DESC
    ");

    while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
        fputcsv($output, $row);
    }
    fclose($output);
    exit();
}

// Add other export types as needed
?>
