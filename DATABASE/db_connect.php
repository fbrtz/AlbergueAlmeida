<?php
// Database connection helper for local XAMPP environment
function db_connect() {
    $host = '127.0.0.1';
    $db   = 'albergue_almeida';
    $user = 'root';
    $pass = '';
    $charset = 'utf8mb4';

    $dsn = "mysql:host=$host;dbname=$db;charset=$charset";
    $options = [
        PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        PDO::ATTR_EMULATE_PREPARES   => false,
    ];

    try {
        return new PDO($dsn, $user, $pass, $options);
    } catch (PDOException $e) {
        // In production you might log and handle differently
        http_response_code(500);
        echo json_encode(['success' => false, 'error' => 'DB connection failed: ' . $e->getMessage()]);
        exit;
    }
}
