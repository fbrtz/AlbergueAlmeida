<?php
header("Content-Type: application/json");
$con = new mysqli("localhost","root","","albergue_almeida");
if ($con->connect_error) { http_response_code(500); echo json_encode(["erro"=>"conn"]); exit; }
$id = isset($_GET['id']) ? intval($_GET['id']) : 0;
if (!$id) { echo json_encode(["erro"=>"id"]); exit; }

$stmt = $con->prepare("SELECT * FROM vagas WHERE id = ?");
$stmt->bind_param("i",$id);
$stmt->execute();
$res = $stmt->get_result();
if ($res->num_rows === 0) { echo json_encode(["erro"=>"notfound"]); exit; }
$v = $res->fetch_assoc();

// caracteristicas
$car = [];
$cRes = $con->query("
  SELECT c.id, c.nome 
  FROM caracteristicas_vagas cv
  JOIN caracteristicas c ON c.id = cv.caracteristica_id
  WHERE cv.vaga_id = " . intval($id)
);
while ($r = $cRes->fetch_assoc()) $car[] = $r;
$v['caracteristicas'] = $car;

echo json_encode($v);
