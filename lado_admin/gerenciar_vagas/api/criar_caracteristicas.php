<?php
header("Content-Type: application/json");
$con = new mysqli("localhost","root","","albergue_almeida");
$nome = trim($_POST['nome'] ?? "");
$tipo = $_POST['tipo'] ?? 'vaga';
if ($nome === "") { http_response_code(400); echo json_encode(["erro"=>"nome"]); exit; }

// inserir (evitar duplicados)
$stmt = $con->prepare("INSERT INTO caracteristicas (nome,tipo) VALUES (?, ?)");
$stmt->bind_param("ss",$nome,$tipo);
$stmt->execute();
$id = $con->insert_id;
echo json_encode(["id"=>$id,"nome"=>$nome]);
