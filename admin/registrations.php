<?php
session_start();
require_once '../includes/db.php';

if (!isset($_SESSION['admin_id'])) {
    header("Location: login.php");
    exit();
}

$search = $_GET['search'] ?? '';
$status = $_GET['status'] ?? '';
$race = $_GET['race'] ?? '';

$query = "
    SELECT r.*, u.first_name, u.last_name, u.email, u.phone, p.status as p_status, p.transaction_id, p.amount
    FROM registrations r
    JOIN users u ON r.user_id = u.id
    LEFT JOIN payments p ON r.payment_id = p.id
    WHERE 1=1
";

$params = [];

if ($search) {
    $query .= " AND (u.first_name LIKE ? OR u.last_name LIKE ? OR u.email LIKE ? OR r.bib_number LIKE ?)";
    $params = array_merge($params, ["%$search%", "%$search%", "%$search%", "%$search%"]);
}

if ($status) {
    $query .= " AND r.status = ?";
    $params[] = $status;
}

if ($race) {
    $query .= " AND r.race_category = ?";
    $params[] = $race;
}

$query .= " ORDER BY r.created_at DESC";
$stmt = $pdo->prepare($query);
$stmt->execute($params);
$registrations = $stmt->fetchAll();

?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Marathon Registrations | Admin</title>
    <link rel="stylesheet" href="dashboard.css">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
</head>
<body>
    <div class="dashboard-layout">
        <aside class="sidebar">
            <div class="sidebar-header"><img src="../assets/Logo 2.png" alt="Hekima Logo"></div>
            <nav>
                <ul class="nav-list">
                    <li class="nav-item"><a href="index.php" class="nav-link"><i class="fas fa-tachometer-alt"></i> Dashboard</a></li>
                    <li class="nav-item"><a href="registrations.php" class="nav-link active"><i class="fas fa-running"></i> Marathon Regs</a></li>
                    <li class="nav-item"><a href="payments.php" class="nav-link"><i class="fas fa-money-bill-wave"></i> Payments</a></li>
                    <li class="nav-item"><a href="volunteers.php" class="nav-link"><i class="fas fa-hands-helping"></i> Volunteers</a></li>
                    <li class="nav-item"><a href="contact.php" class="nav-link"><i class="fas fa-envelope"></i> Messages</a></li>
                    <li class="nav-item"><a href="logs.php" class="nav-link"><i class="fas fa-list-ul"></i> Activity Logs</a></li>
                    <li class="nav-item" style="margin-top: 40px;"><a href="logout.php" class="nav-link" style="color: var(--danger);"><i class="fas fa-sign-out-alt"></i> Logout</a></li>
                </ul>
            </nav>
        </aside>

        <main class="main-content">
            <header class="top-bar">
                <h1 class="page-title">Marathon <span style="color: var(--primary);">Registrations</span></h1>
                <div class="actions">
                    <a href="export.php?type=registrations" class="btn btn-primary" style="width: auto;"><i class="fas fa-file-export"></i> Export CSV</a>
                </div>
            </header>

            <div class="data-card">
                <form class="filters-bar" style="display: flex; gap: 15px; margin-bottom: 24px;">
                    <input type="text" name="search" class="form-input" placeholder="Search name, email, BIB..." value="<?php echo htmlspecialchars($search); ?>">
                    <select name="status" class="form-input" style="width: 200px;">
                        <option value="">All Statuses</option>
                        <option value="pending" <?php if($status=='pending') echo 'selected'; ?>>Pending</option>
                        <option value="confirmed" <?php if($status=='confirmed') echo 'selected'; ?>>Confirmed</option>
                    </select>
                    <select name="race" class="form-input" style="width: 200px;">
                        <option value="">All Races</option>
                        <option value="21k" <?php if($race=='21k') echo 'selected'; ?>>21KM</option>
                        <option value="10k" <?php if($race=='10k') echo 'selected'; ?>>10KM</option>
                        <option value="corporate" <?php if($race=='corporate') echo 'selected'; ?>>Corporate</option>
                        <option value="community" <?php if($race=='community') echo 'selected'; ?>>Community</option>
                    </select>
                    <button type="submit" class="btn btn-primary" style="width: 100px;">Filter</button>
                </form>

                <div class="table-responsive">
                    <table>
                        <thead>
                            <tr>
                                <th>BIB</th>
                                <th>Runner Details</th>
                                <th>Category</th>
                                <th>Payment Status</th>
                                <th>Trans ID</th>
                                <th>Date</th>
                            </tr>
                        </thead>
                        <tbody>
                            <?php foreach ($registrations as $reg): ?>
                            <tr>
                                <td style="font-family: monospace; font-weight: 800; color: var(--primary);">
                                    <?php echo $reg['bib_number'] ?: '<span style="color: var(--text-muted); font-weight: 400;">—</span>'; ?>
                                </td>
                                <td>
                                    <div style="font-weight: 600;"><?php echo htmlspecialchars($reg['first_name'] . ' ' . $reg['last_name']); ?></div>
                                    <div style="font-size: 0.75rem; color: var(--text-muted);"><?php echo htmlspecialchars($reg['email']); ?> | <?php echo htmlspecialchars($reg['phone']); ?></div>
                                </td>
                                <td><?php echo strtoupper($reg['race_category']); ?></td>
                                <td>
                                    <?php if ($reg['p_status'] == 'success'): ?>
                                        <span class="badge badge-success">Success</span>
                                    <?php elseif ($reg['p_status'] == 'pending'): ?>
                                        <span class="badge badge-warning">Pending</span>
                                    <?php else: ?>
                                        <span class="badge badge-danger"><?php echo ucfirst($reg['p_status']); ?></span>
                                    <?php endif; ?>
                                </td>
                                <td style="font-size: 0.8rem; font-family: monospace;"><?php echo $reg['transaction_id'] ?: '—'; ?></td>
                                <td style="font-size: 0.8rem;"><?php echo date('Y-m-d H:i', strtotime($reg['created_at'])); ?></td>
                            </tr>
                            <?php endforeach; ?>
                        </tbody>
                    </table>
                </div>
            </div>
        </main>
    </div>
</body>
</html>
