<?php
error_reporting(E_ALL);
ini_set('display_errors', 1);
header("Content-Type: application/json; charset=utf-8");

$con = new mysqli("localhost", "root", "", "albergue_almeida");
if ($con->connect_error) {
    echo json_encode(["erro" => "Falha na conexão"]);
    exit;
}

$reserva_id = intval($_GET['reserva_id'] ?? 0);
if ($reserva_id <= 0) {
    echo json_encode(["erro" => "ID inválido"]);
    exit;
}

// pegar o quarto da reserva
$sql = "
    SELECT v.quarto_id, r.vaga_id
    FROM reservas r
    JOIN vagas v ON r.vaga_id = v.id
    WHERE r.id = $reserva_id
";

$q = $con->query($sql);
if (!$q || $q->num_rows == 0) {
    echo json_encode(["erro" => "Reserva não encontrada"]);
    exit;
}

$row = $q->fetch_assoc();
$quarto_id = intval($row['quarto_id']);

// listar vagas do quarto
$sql2 = "
    SELECT id, nome
    FROM vagas
    WHERE quarto_id = $quarto_id
    ORDER BY nome ASC
";

$res = $con->query($sql2);
$out = [];

while ($r = $res->fetch_assoc()) {
    $out[] = [
        "id" => intval($r['id']),
        "nome" => $r['nome']
    ];
}

echo json_encode($out, JSON_UNESCAPED_UNICODE);
