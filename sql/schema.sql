CREATE DATABASE IF NOT EXISTS hekima_marathon;
USE hekima_marathon;

-- Users Table
CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    email VARCHAR(150) UNIQUE NOT NULL,
    phone VARCHAR(20) NOT NULL,
    date_of_birth DATE,
    gender VARCHAR(20),
    nationality VARCHAR(50),
    id_number VARCHAR(50) UNIQUE NOT NULL,
    county VARCHAR(100),
    password VARCHAR(255) NULL, -- Optional if we implement full auth later
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Payments Table
CREATE TABLE IF NOT EXISTS payments (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    amount DECIMAL(10, 2) NOT NULL,
    payment_method ENUM('mpesa', 'card', 'bank') NOT NULL,
    transaction_id VARCHAR(100) UNIQUE NULL,
    reference_id VARCHAR(100) UNIQUE NOT NULL, -- Our internal ref for PayHero
    status ENUM('pending', 'success', 'failed', 'cancelled') DEFAULT 'pending',
    checkout_request_id VARCHAR(100) NULL,
    metadata JSON NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
);

-- Marathon Registrations Table
CREATE TABLE IF NOT EXISTS registrations (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    payment_id INT NULL,
    race_category VARCHAR(50) NOT NULL,
    bib_number VARCHAR(20) UNIQUE NULL,
    ak_number VARCHAR(50) NULL,
    tshirt_size VARCHAR(10) NULL,
    medical_condition TEXT NULL,
    emergency_contact_name VARCHAR(100) NULL,
    emergency_contact_phone VARCHAR(20) NULL,
    status ENUM('pending', 'confirmed') DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (payment_id) REFERENCES payments(id)
);

-- Volunteer Forms
CREATE TABLE IF NOT EXISTS volunteers (
    id INT AUTO_INCREMENT PRIMARY KEY,
    full_name VARCHAR(200) NOT NULL,
    email VARCHAR(150) NOT NULL,
    phone VARCHAR(20) NOT NULL,
    category VARCHAR(100) NOT NULL,
    organization VARCHAR(200),
    id_number VARCHAR(50),
    residence VARCHAR(200),
    transport_assistance BOOLEAN DEFAULT FALSE,
    accommodation_assistance BOOLEAN DEFAULT FALSE,
    stipend_expectation BOOLEAN DEFAULT FALSE,
    stipend_amount DECIMAL(10, 2) NULL,
    status ENUM('pending', 'reviewed', 'accepted', 'rejected') DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Contact Forms
CREATE TABLE IF NOT EXISTS contact_submissions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(200) NOT NULL,
    email VARCHAR(150) NOT NULL,
    subject VARCHAR(200),
    message TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Activity Logs
CREATE TABLE IF NOT EXISTS activity_logs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NULL,
    event_type VARCHAR(50) NOT NULL,
    description TEXT,
    metadata JSON NULL,
    ip_address VARCHAR(45),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Admin Users
CREATE TABLE IF NOT EXISTS admins (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(150) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    role ENUM('superadmin', 'manager', 'editor') DEFAULT 'manager',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Karura Run Registrations (Paid)
CREATE TABLE IF NOT EXISTS karura_registrations (
    id INT AUTO_INCREMENT PRIMARY KEY,
    names VARCHAR(200) NOT NULL,
    phone VARCHAR(20) NOT NULL,
    email VARCHAR(150) NOT NULL,
    company VARCHAR(200) NULL,
    emergency_contact VARCHAR(20) NOT NULL,
    payment_status ENUM('pending', 'success', 'failed') DEFAULT 'pending',
    transaction_id VARCHAR(100) NULL,
    checkout_request_id VARCHAR(100) NULL,
    reference VARCHAR(100) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Karura Sponsorship Requests
CREATE TABLE IF NOT EXISTS karura_sponsorships (
    id INT AUTO_INCREMENT PRIMARY KEY,
    names VARCHAR(200) NOT NULL,
    phone VARCHAR(20) NOT NULL,
    reg_no VARCHAR(50) NOT NULL,
    institution VARCHAR(200) NOT NULL,
    program VARCHAR(200) NOT NULL,
    emergency_contact VARCHAR(20) NOT NULL,
    status ENUM('pending', 'approved', 'rejected') DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insert default admin (password: admin123)
-- In production, you'd use password_hash
INSERT INTO admins (username, email, password, role) VALUES ('admin', 'admin@phumolomarathon.co.ke', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'superadmin');
