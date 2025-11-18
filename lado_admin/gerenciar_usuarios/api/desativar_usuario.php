<?php
header("Content-Type: application/json");
$con = new mysqli("localhost","root","","albergue_almeida");
if ($con->connect_error) { http_response_code(500); echo json_encode(["erro"=>"conn"]); exit; }

$id = isset($_POST['id']) ? intval($_POST['id']) : 0;
$status = isset($_POST['status']) ? $_POST['status'] : '';

$allowed = ['ativo','inativo','bloqueado'];
if (!$id || !in_array($status, $allowed)) {
    echo json_encode(["erro"=>"Parâmetros inválidos"]);
    exit;
}

$stmt = $con->prepare("UPDATE usuarios SET status = ? WHERE id = ?");
$stmt->bind_param("si", $status, $id);
$ok = $stmt->execute();
if (!$ok) echo json_encode(["erro"=>$stmt->error]);
else echo json_encode(["status"=>"OK"]);
