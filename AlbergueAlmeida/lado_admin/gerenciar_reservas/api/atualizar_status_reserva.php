<?php
error_reporting(E_ALL);
ini_set('display_errors', 1);

header("Content-Type: application/json; charset=utf-8");

$con = new mysqli("localhost", "root", "", "albergue_almeida");
if ($con->connect_error) {
    http_response_code(500);
    echo json_encode(["erro" => "Falha na conexão"]);
    exit;
}

$id = isset($_POST['id']) ? intval($_POST['id']) : 0;
$status = isset($_POST['status']) ? $_POST['status'] : '';

$permitidos = ['pendente', 'confirmado', 'cancelado'];

if ($id <= 0 || !in_array($status, $permitidos)) {
    echo json_encode(["erro" => "Dados inválidos"]);
    exit;
}

$stmt = $con->prepare("UPDATE reservas SET status = ?, atualizado_em = NOW() WHERE id = ?");
$stmt->bind_param("si", $status, $id);

if ($stmt->execute()) {
    echo json_encode(["status" => "OK"]);
} else {
    echo json_encode(["erro" => $stmt->error]);
}
