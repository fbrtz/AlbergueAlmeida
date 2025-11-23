<?php
require_once '../../DATABASE/db_connect.php';
header('Content-Type: application/json; charset=utf-8');

try {
    $pdo = db_connect();
    $sql = "SELECT id, nome FROM caracteristicas WHERE tipo IN ('quarto', 'ambos') ORDER BY nome";
    $stmt = $pdo->prepare($sql);
    $stmt->execute();
    $caract = $stmt->fetchAll(PDO::FETCH_ASSOC);
    echo json_encode(['success' => true, 'caracteristicas' => $caract]);
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'error' => $e->getMessage()]);
}
