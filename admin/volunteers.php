<?php
session_start();
require_once '../includes/db.php';

if (!isset($_SESSION['admin_id'])) {
    header("Location: login.php");
    exit();
}

$stmt = $pdo->query("SELECT * FROM volunteers ORDER BY created_at DESC");
$volunteers = $stmt->fetchAll();

?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Volunteers | Admin</title>
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
                    <li class="nav-item"><a href="registrations.php" class="nav-link"><i class="fas fa-running"></i> Marathon Regs</a></li>
                    <li class="nav-item"><a href="payments.php" class="nav-link"><i class="fas fa-money-bill-wave"></i> Payments</a></li>
                    <li class="nav-item"><a href="volunteers.php" class="nav-link active"><i class="fas fa-hands-helping"></i> Volunteers</a></li>
                    <li class="nav-item"><a href="contact.php" class="nav-link"><i class="fas fa-envelope"></i> Messages</a></li>
                    <li class="nav-item"><a href="logs.php" class="nav-link"><i class="fas fa-list-ul"></i> Activity Logs</a></li>
                    <li class="nav-item" style="margin-top: 40px;"><a href="logout.php" class="nav-link" style="color: var(--danger);"><i class="fas fa-sign-out-alt"></i> Logout</a></li>
                </ul>
            </nav>
        </aside>

        <main class="main-content">
            <header class="top-bar">
                <h1 class="page-title">Volunteer <span style="color: var(--primary);">Sign-ups</span></h1>
            </header>

            <div class="data-card">
                <div class="table-responsive">
                    <table>
                        <thead>
                            <tr>
                                <th>Name</th>
                                <th>Contact</th>
                                <th>Category</th>
                                <th>Org/ID</th>
                                <th>Assist. Req?</th>
                                <th>Stipend?</th>
                                <th>Date</th>
                            </tr>
                        </thead>
                        <tbody>
                            <?php foreach ($volunteers as $v): ?>
                            <tr>
                                <td><strong><?php echo htmlspecialchars($v['full_name']); ?></strong></td>
                                <td style="font-size: 0.8rem;">
                                    <div><?php echo htmlspecialchars($v['email']); ?></div>
                                    <div><?php echo htmlspecialchars($v['phone']); ?></div>
                                </td>
                                <td><span class="badge badge-warning"><?php echo htmlspecialchars($v['category']); ?></span></td>
                                <td style="font-size: 0.8rem;">
                                    <div>Org: <?php echo htmlspecialchars($v['organization'] ?: '—'); ?></div>
                                    <div>ID: <?php echo htmlspecialchars($v['id_number'] ?: '—'); ?></div>
                                </td>
                                <td>
                                    <?php if($v['transport_assistance']): ?> <span title="Transport">🚌</span> <?php endif; ?>
                                    <?php if($v['accommodation_assistance']): ?> <span title="Accomm.">🏨</span> <?php endif; ?>
                                </td>
                                <td>
                                    <?php if($v['stipend_expectation']): ?>
                                        <span class="badge badge-danger">KES <?php echo number_format($v['stipend_amount']); ?></span>
                                    <?php else: ?>
                                        <span class="badge badge-success">No</span>
                                    <?php endif; ?>
                                </td>
                                <td style="font-size: 0.8rem;"><?php echo date('Y-m-d', strtotime($v['created_at'])); ?></td>
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
