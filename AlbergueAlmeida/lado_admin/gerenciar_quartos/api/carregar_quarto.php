<?php
header("Content-Type: application/json");
$con = new mysqli("localhost", "root", "", "albergue_almeida");
if ($con->connect_error) {
    http_response_code(500);
    echo json_encode(["erro" => "Falha na conexão"]);
    exit;
}

$id = isset($_GET['id']) ? intval($_GET['id']) : 0;
if ($id <= 0) {
    echo json_encode(["erro" => "ID inválido"]);
    exit;
}

$stmt = $con->prepare("SELECT id, titulo, descricao, total_vagas, preco_base, img0, img1, img2 FROM quartos WHERE id = ?");
$stmt->bind_param("i", $id);
$stmt->execute();
$res = $stmt->get_result();

if ($res->num_rows === 0) {
    echo json_encode(["erro" => "Quarto não encontrado"]);
    exit;
}

$q = $res->fetch_assoc();

// montar array 'imagens' por compatibilidade (opcional)
$imgs = [];
if (!empty($q['img0'])) $imgs[] = $q['img0'];
if (!empty($q['img1'])) $imgs[] = $q['img1'];
if (!empty($q['img2'])) $imgs[] = $q['img2'];
if (count($imgs) === 0) $imgs[] = "https://via.placeholder.com/800x500?text=Sem+Imagem";

$q['imagens'] = $imgs;

echo json_encode($q);
