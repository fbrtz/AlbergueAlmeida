<?php
header("Content-Type: application/json");
$con = new mysqli("localhost","root","","albergue_almeida");
$q = isset($_GET['q']) ? trim($_GET['q']) : "";
$q_esc = $con->real_escape_string($q);
$sql = "SELECT id, nome FROM caracteristicas WHERE tipo IN ('vaga','ambos') AND nome LIKE '%$q_esc%' ORDER BY nome LIMIT 20";
$res = $con->query($sql);
$out = [];
while ($r = $res->fetch_assoc()) $out[] = $r;
echo json_encode($out);
