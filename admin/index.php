<?php
session_start();
require_once '../includes/db.php';

if (!isset($_SESSION['admin_id'])) {
    header("Location: login.php");
    exit();
}

// Fetch stats
$total_users = $pdo->query("SELECT COUNT(*) FROM users")->fetchColumn();
$total_paid = $pdo->query("SELECT COUNT(*) FROM registrations WHERE status = 'confirmed'")->fetchColumn();
$total_volunteers = $pdo->query("SELECT COUNT(*) FROM volunteers")->fetchColumn();
$total_revenue = $pdo->query("SELECT SUM(amount) FROM payments WHERE status = 'success'")->fetchColumn() ?: 0;

// New registrations (last 24h)
$new_24h = $pdo->query("SELECT COUNT(*) FROM users WHERE created_at >= NOW() - INTERVAL 1 DAY")->fetchColumn();

// Recent registrations
$recent_regs = $pdo->query("
    SELECT r.*, u.first_name, u.last_name, u.email, p.status as p_status, p.amount
    FROM registrations r
    JOIN users u ON r.user_id = u.id
    LEFT JOIN payments p ON r.payment_id = p.id
    ORDER BY r.created_at DESC
    LIMIT 10
")->fetchAll();

?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Admin Dashboard | Hekima Marathon</title>
    <link rel="stylesheet" href="dashboard.css">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;800&display=swap" rel="stylesheet">
</head>
<body>
    <div class="dashboard-layout">
        <aside class="sidebar">
            <div class="sidebar-header">
                <img src="../assets/Logo 2.png" alt="Hekima Logo">
            </div>
            <nav>
                <ul class="nav-list">
                    <li class="nav-item">
                        <a href="index.php" class="nav-link active">
                            <i class="fas fa-tachometer-alt"></i> Dashboard
                        </a>
                    </li>
                    <li class="nav-item">
                        <a href="registrations.php" class="nav-link">
                            <i class="fas fa-running"></i> Marathon Regs
                        </a>
                    </li>
                    <li class="nav-item">
                        <a href="payments.php" class="nav-link">
                            <i class="fas fa-money-bill-wave"></i> Payments
                        </a>
                    </li>
                    <li class="nav-item">
                        <a href="volunteers.php" class="nav-link">
                            <i class="fas fa-hands-helping"></i> Volunteers
                        </a>
                    </li>
                    <li class="nav-item">
                        <a href="contact.php" class="nav-link">
                            <i class="fas fa-envelope"></i> Messages
                        </a>
                    </li>
                    <li class="nav-item">
                        <a href="logs.php" class="nav-link">
                            <i class="fas fa-list-ul"></i> Activity Logs
                        </a>
                    </li>
                    <li class="nav-item" style="margin-top: 40px;">
                        <a href="logout.php" class="nav-link" style="color: var(--danger);">
                            <i class="fas fa-sign-out-alt"></i> Logout
                        </a>
                    </li>
                </ul>
            </nav>
        </aside>

        <main class="main-content">
            <header class="top-bar">
                <h1 class="page-title">Dashboard <span style="color: var(--primary);">Overview</span></h1>
                <div class="user-info">
                    <span style="color: var(--text-muted);">Welcome, <strong><?php echo htmlspecialchars($_SESSION['admin_username']); ?></strong></span>
                </div>
            </header>

            <div class="stats-grid">
                <div class="stat-card">
                    <div class="stat-label">Total Users</div>
                    <div class="stat-value"><?php echo number_format($total_users); ?></div>
                    <div style="font-size: 0.75rem; color: var(--success); margin-top: 8px;">
                        <i class="fas fa-arrow-up"></i> <?php echo $new_24h; ?> new (24h)
                    </div>
                </div>
                <div class="stat-card">
                    <div class="stat-label">Confirmed Runners</div>
                    <div class="stat-value"><?php echo number_format($total_paid); ?></div>
                    <div style="font-size: 0.75rem; color: var(--text-muted); margin-top: 8px;">
                        Paid & BIB assigned
                    </div>
                </div>
                <div class="stat-card">
                    <div class="stat-label">Total Revenue</div>
                    <div class="stat-value">KES <?php echo number_format($total_revenue); ?></div>
                    <div style="font-size: 0.75rem; color: var(--info); margin-top: 8px;">
                        Successful transactions
                    </div>
                </div>
                <div class="stat-card">
                    <div class="stat-label">Volunteers</div>
                    <div class="stat-value"><?php echo number_format($total_volunteers); ?></div>
                    <div style="font-size: 0.75rem; color: var(--text-muted); margin-top: 8px;">
                        Across all categories
                    </div>
                </div>
            </div>

            <div class="data-card">
                <div class="card-header">
                    <h2 style="font-size: 1.1rem; font-weight: 700;">Recent <span style="color: var(--primary);">Registrations</span></h2>
                    <a href="registrations.php" style="color: var(--primary); text-decoration: none; font-size: 0.85rem;">View All →</a>
                </div>
                <div class="table-responsive">
                    <table>
                        <thead>
                            <tr>
                                <th>Runner</th>
                                <th>Category</th>
                                <th>Payment</th>
                                <th>BIB</th>
                                <th>Date</th>
                            </tr>
                        </thead>
                        <tbody>
                            <?php foreach ($recent_regs as $reg): ?>
                            <tr>
                                <td>
                                    <div style="font-weight: 600;"><?php echo htmlspecialchars($reg['first_name'] . ' ' . $reg['last_name']); ?></div>
                                    <div style="font-size: 0.75rem; color: var(--text-muted);"><?php echo htmlspecialchars($reg['email']); ?></div>
                                </td>
                                <td><?php echo strtoupper($reg['race_category']); ?></td>
                                <td>
                                    <?php if ($reg['p_status'] == 'success'): ?>
                                        <span class="badge badge-success">Paid</span>
                                    <?php elseif ($reg['p_status'] == 'pending'): ?>
                                        <span class="badge badge-warning">Pending</span>
                                    <?php else: ?>
                                        <span class="badge badge-danger">Failed</span>
                                    <?php endif; ?>
                                </td>
                                <td style="font-family: monospace; font-weight: 700;">
                                    <?php echo $reg['bib_number'] ?: '<span style="color: var(--text-muted);">TBA</span>'; ?>
                                </td>
                                <td style="font-size: 0.8rem; color: var(--text-muted);">
                                    <?php echo date('M d, H:i', strtotime($reg['created_at'])); ?>
                                </td>
                            </tr>
                            <?php endforeach; ?>
                        </tbody>
                    </table>
                </div>
            </div>

            <div class="grid-2" style="display: grid; grid-template-columns: 1fr 1fr; gap: 30px;">
                <div class="data-card">
                    <div class="card-header">
                        <h2 style="font-size: 1.1rem; font-weight: 700;">Payment <span style="color: var(--primary);">Trends</span></h2>
                    </div>
                    <div class="chart-container">
                        [Chart Visualization Placeholder]
                    </div>
                </div>
                <div class="data-card">
                    <div class="card-header">
                        <h2 style="font-size: 1.1rem; font-weight: 700;">Form <span style="color: var(--primary);">Submissions</span></h2>
                    </div>
                    <div style="display: flex; flex-direction: column; gap: 15px;">
                        <div style="display: flex; justify-content: space-between; align-items: center; padding-bottom: 10px; border-bottom: 1px solid var(--border);">
                            <span style="font-size: 0.9rem;">Volunteer Sign-ups</span>
                            <span style="font-weight: 700; color: var(--primary);"><?php echo $total_volunteers; ?></span>
                        </div>
                        <div style="display: flex; justify-content: space-between; align-items: center; padding-bottom: 10px; border-bottom: 1px solid var(--border);">
                            <span style="font-size: 0.9rem;">Contact Messages</span>
                            <span style="font-weight: 700; color: var(--primary);"><?php echo $pdo->query("SELECT COUNT(*) FROM contact_submissions")->fetchColumn(); ?></span>
                        </div>
                    </div>
                </div>
            </div>
        </main>
    </div>
</body>
</html>
