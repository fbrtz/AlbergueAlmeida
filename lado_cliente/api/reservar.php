<?php
require_once '../../DATABASE/db_connect.php';
header('Content-Type: application/json; charset=utf-8');

// Use server-side session to identify logged-in user (more secure than trusting client payload)
session_start();

try {
    $pdo = db_connect();
    
    $data = json_decode(file_get_contents('php://input'), true);
    if (!$data) {
        $data = $_POST;
    }

    $vaga_id = isset($data['vaga_id']) ? intval($data['vaga_id']) : 0;
    $checkIn = isset($data['checkIn']) ? $data['checkIn'] : null;
    $checkOut = isset($data['checkOut']) ? $data['checkOut'] : null;
    // Do NOT trust client-supplied hospede_id; prefer session value
    $client_hospede = isset($data['hospede_id']) ? intval($data['hospede_id']) : 0;
    $session_hospede = isset($_SESSION['user_id']) ? intval($_SESSION['user_id']) : 0;
    $valor = isset($data['valor']) ? floatval($data['valor']) : 0;

    // Use session user if available, otherwise fall back to client (but reject later)
    $hospede_id = $session_hospede > 0 ? $session_hospede : $client_hospede;

    // DEBUG: log received data
    error_log("DEBUG reservar.php: vaga_id=$vaga_id, client_hospede=$client_hospede, session_hospede=$session_hospede, used_hospede=$hospede_id, checkIn=$checkIn, checkOut=$checkOut, valor=$valor");
    error_log("DEBUG data received: " . json_encode($data));

    if (!$vaga_id || !$checkIn || !$checkOut || $hospede_id <= 0) {
        http_response_code(400);
        error_log("DEBUG: Invalid parameters - vaga_id=$vaga_id, hospede_id=$hospede_id, checkIn=$checkIn, checkOut=$checkOut");
        echo json_encode(['error' => 'missing_or_invalid_parameters']);
        exit;
    }

    $inicio = $checkIn . ' 00:00:00';
    $fim = $checkOut . ' 00:00:00';

    // Check for overlapping reservations for the same vaga
    $sqlCheck = "SELECT COUNT(*) as cnt FROM reservas 
                 WHERE vaga_id = ? 
                 AND NOT (fim_periodo <= ? OR inicio_periodo >= ?) 
                 AND status != 'cancelado'";
    $stmtCheck = $pdo->prepare($sqlCheck);
    $stmtCheck->execute([$vaga_id, $inicio, $fim]);
    $countRes = $stmtCheck->fetch(PDO::FETCH_ASSOC);
    
    if ($countRes && intval($countRes['cnt']) > 0) {
        http_response_code(409);
        echo json_encode(['error' => 'unavailable']);
        exit;
    }

    // Compute valor if not provided: get quarto price via vaga->quarto
    if ($valor <= 0) {
        $sqlPrice = "SELECT q.preco_base FROM quartos q 
                     JOIN vagas v ON v.quarto_id = q.id 
                     WHERE v.id = ? LIMIT 1";
        $stmtPrice = $pdo->prepare($sqlPrice);
        $stmtPrice->execute([$vaga_id]);
        $priceRes = $stmtPrice->fetch(PDO::FETCH_ASSOC);
        
        $price = isset($priceRes['preco_base']) ? floatval($priceRes['preco_base']) : 0;
        $d1 = new DateTime($checkIn);
        $d2 = new DateTime($checkOut);
        $nights = max(1, $d2->diff($d1)->days);
        $valor = $price * $nights;
    }

    // Insert reservation
    $sqlInsert = "INSERT INTO reservas (vaga_id, hospede_id, inicio_periodo, fim_periodo, valor_total, status) 
                  VALUES (?, ?, ?, ?, ?, ?)";
    $stmtInsert = $pdo->prepare($sqlInsert);
    $status = 'pendente';
    
    error_log("DEBUG: About to insert with hospede_id=$hospede_id, vaga_id=$vaga_id, inicio=$inicio, fim=$fim, valor=$valor");
    
    if ($stmtInsert->execute([$vaga_id, $hospede_id, $inicio, $fim, $valor, $status])) {
        $reserva_id = $pdo->lastInsertId();
        error_log("DEBUG: Reservation created successfully - reserva_id=$reserva_id, hospede_id=$hospede_id");
        echo json_encode(['success' => true, 'reserva_id' => $reserva_id, 'hospede_id' => $hospede_id]);
    } else {
        http_response_code(500);
        error_log("DEBUG: Insert failed - " . json_encode($stmtInsert->errorInfo()));
        echo json_encode(['error' => 'insert_failed']);
    }
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['error' => $e->getMessage()]);
}
