<?php
header("Content-Type: application/json");
$con = new mysqli("localhost","root","","albergue_almeida");
if ($con->connect_error) { http_response_code(500); echo json_encode([]); exit; }

$sql = "SELECT * FROM quartos ORDER BY id DESC";
$result = $con->query($sql);
$quartos = [];

while ($q = $result->fetch_assoc()) {
    $id = intval($q['id']);
    // imagens
    $imgs = [];
    if (!empty($q['img0'])) $imgs[] = $q['img0'];
    if (!empty($q['img1'])) $imgs[] = $q['img1'];
    if (!empty($q['img2'])) $imgs[] = $q['img2'];
    if (count($imgs) === 0) $imgs[] = "https://via.placeholder.com/800x500?text=Sem+Imagem";
    $q['imagens'] = $imgs;

    // caracteristicas do quarto
    $car = [];
    $cRes = $con->query("
      SELECT c.id, c.nome
      FROM caracteristicas_quartos cq
      JOIN caracteristicas c ON c.id = cq.caracteristica_id
      WHERE cq.quarto_id = $id
      ORDER BY c.nome
    ");
    if ($cRes) {
      while ($c = $cRes->fetch_assoc()) $car[] = $c;
    }
    $q['caracteristicas'] = $car;

    $quartos[] = $q;
}

echo json_encode($quartos);
