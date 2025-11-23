<?php
require_once '../../DATABASE/db_connect.php';
header('Content-Type: application/json; charset=utf-8');

try {
    $pdo = db_connect();
    // Get hospede_id from query parameter (MUST be provided after login)
    // In production, validate this against authenticated user session
    $hospede_id = isset($_GET['hospede_id']) ? intval($_GET['hospede_id']) : null;
    
    // Security check: ensure hospede_id is valid
    if ($hospede_id === null || $hospede_id <= 0) {
        http_response_code(400);
        echo json_encode(['success' => false, 'error' => 'invalid_hospede_id']);
        exit;
    }

    $sql = "SELECT r.id, r.vaga_id, v.nome AS vaga_nome, v.quarto_id, q.titulo AS quarto_titulo, r.hospede_id, r.inicio_periodo, r.fim_periodo, r.status, r.valor_total
            FROM reservas r
            JOIN vagas v ON r.vaga_id = v.id
            JOIN quartos q ON v.quarto_id = q.id
            WHERE r.hospede_id = ?
            ORDER BY r.inicio_periodo DESC";

    $stmt = $pdo->prepare($sql);
    $stmt->execute([$hospede_id]);
    $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);

    // Normalize types
    foreach ($rows as &$row) {
        $row['id'] = intval($row['id']);
        $row['vaga_id'] = intval($row['vaga_id']);
        $row['quarto_id'] = intval($row['quarto_id']);
        $row['hospede_id'] = intval($row['hospede_id']);
        $row['valor_total'] = floatval($row['valor_total']);
    }

    echo json_encode(['success' => true, 'reservas' => $rows], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'error' => $e->getMessage()]);
}
