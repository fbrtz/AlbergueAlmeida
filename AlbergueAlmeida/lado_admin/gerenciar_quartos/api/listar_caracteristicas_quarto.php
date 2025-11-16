<?php
header("Content-Type: application/json");
$con = new mysqli("localhost","root","","albergue_almeida");
if ($con->connect_error) { http_response_code(500); echo json_encode([]); exit; }

$quarto_id = isset($_GET['quarto_id']) ? intval($_GET['quarto_id']) : 0;
if ($quarto_id <= 0) { echo json_encode([]); exit; }

$stmt = $con->prepare("
  SELECT c.id, c.nome
  FROM caracteristicas_quartos cq
  JOIN caracteristicas c ON c.id = cq.caracteristica_id
  WHERE cq.quarto_id = ?
  ORDER BY c.nome
");
$stmt->bind_param("i", $quarto_id);
$stmt->execute();
$res = $stmt->get_result();
$out = [];
while ($r = $res->fetch_assoc()) $out[] = $r;
echo json_encode($out);
