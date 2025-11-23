<?php
require_once '../../DATABASE/db_connect.php';
header('Content-Type: application/json; charset=utf-8');

try {
    $pdo = db_connect();

    $data = json_decode(file_get_contents('php://input'), true);
    if (!$data) $data = $_POST;

    $reserva_id = isset($data['reserva_id']) ? intval($data['reserva_id']) : 0;
    if (!$reserva_id) {
        http_response_code(400);
        echo json_encode(['success' => false, 'error' => 'missing_reserva_id']);
        exit;
    }

    // Check existing
    $stmt = $pdo->prepare('SELECT status FROM reservas WHERE id = ? LIMIT 1');
    $stmt->execute([$reserva_id]);
    $row = $stmt->fetch(PDO::FETCH_ASSOC);
    if (!$row) {
        http_response_code(404);
        echo json_encode(['success' => false, 'error' => 'not_found']);
        exit;
    }

    if ($row['status'] === 'cancelado') {
        echo json_encode(['success' => true, 'message' => 'already_cancelled']);
        exit;
    }

    // Update status to cancelado
    $u = $pdo->prepare('UPDATE reservas SET status = ? WHERE id = ?');
    if ($u->execute(['cancelado', $reserva_id])) {
        echo json_encode(['success' => true, 'reserva_id' => $reserva_id]);
    } else {
        http_response_code(500);
        echo json_encode(['success' => false, 'error' => 'update_failed']);
    }
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'error' => $e->getMessage()]);
}
