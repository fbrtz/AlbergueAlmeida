<?php
header("Content-Type: application/json");
$con = new mysqli("localhost","root","","albergue_almeida");
if ($con->connect_error) { http_response_code(500); echo json_encode(["erro"=>"conn"]); exit; }

$id = isset($_GET['id']) ? intval($_GET['id']) : 0;
if (!$id) { echo json_encode(["erro"=>"invalid id"]); exit; }

$stmt = $con->prepare("SELECT id, nome, cpf, nascimento, email, status, funcao, criado_em, atualizado_em FROM usuarios WHERE id = ?");
$stmt->bind_param("i",$id);
$stmt->execute();
$res = $stmt->get_result();
if ($row = $res->fetch_assoc()) {
    echo json_encode($row);
} else {
    echo json_encode(["erro"=>"Usuário não encontrado"]);
}
