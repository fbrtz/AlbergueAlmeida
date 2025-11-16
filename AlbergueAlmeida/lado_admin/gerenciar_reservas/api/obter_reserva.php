<?php
error_reporting(E_ALL);
ini_set('display_errors', 1);
header("Content-Type: application/json; charset=utf-8");

$con = new mysqli("localhost", "root", "", "albergue_almeida");
if ($con->connect_error) {
    echo json_encode(["erro" => "Falha na conexão"]);
    exit;
}

$id = isset($_GET['id']) ? intval($_GET['id']) : 0;
if ($id <= 0) {
    echo json_encode(["erro" => "ID inválido"]);
    exit;
}

$sql = "
    SELECT r.*, v.nome AS vaga_nome, q.titulo AS quarto_titulo, u.nome AS hospede_nome
    FROM reservas r
    JOIN vagas v ON r.vaga_id = v.id
    JOIN quartos q ON v.quarto_id = q.id
    JOIN usuarios u ON r.hospede_id = u.id
    WHERE r.id = $id
";

$res = $con->query($sql);

if (!$res || $res->num_rows == 0) {
    echo json_encode(["erro" => "Reserva não encontrada"]);
    exit;
}

echo json_encode($res->fetch_assoc(), JSON_UNESCAPED_UNICODE);
