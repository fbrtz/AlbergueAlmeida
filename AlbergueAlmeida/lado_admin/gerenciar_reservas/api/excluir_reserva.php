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

if ($id <= 0) {
    echo json_encode(["erro" => "ID inválido"]);
    exit;
}

$stmt = $con->prepare("DELETE FROM reservas WHERE id = ?");
$stmt->bind_param("i", $id);

if ($stmt->execute()) {
    echo json_encode(["status" => "OK"]);
} else {
    echo json_encode(["erro" => $stmt->error]);
}
