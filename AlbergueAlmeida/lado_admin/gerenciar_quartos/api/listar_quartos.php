<?php
header("Content-Type: application/json");
$con = new mysqli("localhost", "root", "", "albergue_almeida");
if ($con->connect_error) {
    http_response_code(500);
    echo json_encode(["erro" => "Falha na conexão"]);
    exit;
}

$sql = "SELECT * FROM quartos ORDER BY id DESC";
$result = $con->query($sql);

$quartos = [];

while ($q = $result->fetch_assoc()) {
    // montar array de imagens a partir de img0,img1,img2
    $imgs = [];
    if (!empty($q['img0'])) $imgs[] = $q['img0'];
    if (!empty($q['img1'])) $imgs[] = $q['img1'];
    if (!empty($q['img2'])) $imgs[] = $q['img2'];

    // garantir que sempre envie ao menos um placeholder se vazio
    if (count($imgs) === 0) {
        $imgs[] = "https://via.placeholder.com/800x500?text=Sem+Imagem";
    }

    $q['imagens'] = $imgs;
    $quartos[] = $q;
}

echo json_encode($quartos);
