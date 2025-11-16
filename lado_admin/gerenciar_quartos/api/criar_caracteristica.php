<?php
header("Content-Type: application/json");
$con = new mysqli("localhost","root","","albergue_almeida");
if ($con->connect_error) { http_response_code(500); echo json_encode(["erro"=>"db"]); exit; }

$nome = isset($_POST['nome']) ? trim($_POST['nome']) : '';
$tipo = isset($_POST['tipo']) ? $_POST['tipo'] : 'ambos';
if ($nome === '') { http_response_code(400); echo json_encode(["erro"=>"nome vazio"]); exit; }

// evitar duplicata: inserir se não existe, e retornar o id (buscar depois)
$stmt = $con->prepare("SELECT id, nome FROM caracteristicas WHERE nome = ? LIMIT 1");
$stmt->bind_param("s", $nome);
$stmt->execute();
$r = $stmt->get_result();
if ($r && $r->num_rows) {
    $row = $r->fetch_assoc();
    echo json_encode(["id"=>$row['id'],"nome"=>$row['nome']]);
    exit;
}

// inserir novo
$stmt = $con->prepare("INSERT INTO caracteristicas (nome, tipo) VALUES (?, ?)");
$stmt->bind_param("ss", $nome, $tipo);
if ($stmt->execute()) {
    $id = $con->insert_id;
    echo json_encode(["id"=>$id,"nome"=>$nome]);
} else {
    http_response_code(500);
    echo json_encode(["erro"=>$stmt->error]);
}
