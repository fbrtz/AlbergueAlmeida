<?php
header("Content-Type: application/json");

$con = new mysqli("localhost", "root", "", "albergue_almeida");

if ($con->connect_error) {
    http_response_code(500);
    echo json_encode(["erro" => "Falha na conexão"]);
    exit;
}

$id       = intval($_POST["id"]);
$titulo   = $_POST["titulo"] ?? "";
$descricao = $_POST["descricao"] ?? "";
$total    = intval($_POST["total_vagas"]);
$preco    = floatval($_POST["preco_base"]);
$img0     = $_POST["img0"] ?? "";
$img1     = $_POST["img1"] ?? "";
$img2     = $_POST["img2"] ?? "";

$stmt = $con->prepare("
    UPDATE quartos SET
        titulo = ?,
        descricao = ?,
        total_vagas = ?,
        preco_base = ?,
        img0 = ?,
        img1 = ?,
        img2 = ?
    WHERE id = ?
");

$stmt->bind_param(
    "ssidsssi", 
    $titulo, 
    $descricao, 
    $total, 
    $preco, 
    $img0, 
    $img1, 
    $img2, 
    $id
);

if ($stmt->execute()) {
    echo json_encode(["status" => "OK"]);
} else {
    echo json_encode(["erro" => $stmt->error]);
}
