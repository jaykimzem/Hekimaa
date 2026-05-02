<?php
session_start();
require_once '../includes/db.php';

if (isset($_SESSION['admin_id'])) {
    header("Location: index.php");
    exit();
}

$error = '';

if ($_SERVER['REQUEST_METHOD'] == 'POST') {
    $username = trim($_POST['username']);
    $password = $_POST['password'];

    if ($username && $password) {
        $stmt = $pdo->prepare("SELECT * FROM admins WHERE username = ?");
        $stmt->execute([$username]);
        $admin = $stmt->fetch();

        if ($admin && password_verify($password, $admin['password'])) {
            $_SESSION['admin_id'] = $admin['id'];
            $_SESSION['admin_username'] = $admin['username'];
            $_SESSION['admin_role'] = $admin['role'];
            
            // Log activity
            $logStmt = $pdo->prepare("INSERT INTO activity_logs (event_type, description, ip_address) VALUES ('admin_login', ?, ?)");
            $logStmt->execute(["Admin $username logged in", $_SERVER['REMOTE_ADDR']]);

            header("Location: index.php");
            exit();
        } else {
            $error = 'Invalid username or password.';
        }
    } else {
        $error = 'Please fill in all fields.';
    }
}
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Admin Login | Hekima Marathon</title>
    <link rel="stylesheet" href="dashboard.css">
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;800&display=swap" rel="stylesheet">
</head>
<body>
    <div class="login-container">
        <div class="login-card">
            <div class="login-logo">
                <img src="../assets/Logo 2.png" alt="Hekima Logo">
            </div>
            <h2 style="text-align: center; margin-bottom: 24px; font-weight: 800;">Admin <span style="color: var(--primary);">Login</span></h2>
            
            <?php if ($error): ?>
                <div class="alert alert-danger"><?php echo htmlspecialchars($error); ?></div>
            <?php endif; ?>

            <form method="POST">
                <div class="form-group">
                    <label class="form-label">Username</label>
                    <input type="text" name="username" class="form-input" required autofocus>
                </div>
                <div class="form-group">
                    <label class="form-label">Password</label>
                    <input type="password" name="password" class="form-input" required>
                </div>
                <button type="submit" class="btn btn-primary">Login to Dashboard</button>
            </form>
        </div>
    </div>
</body>
</html>
