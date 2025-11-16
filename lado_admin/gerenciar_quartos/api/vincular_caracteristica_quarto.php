<?php
$con = new mysqli("localhost","root","","albergue_almeida");
if ($con->connect_error) { http_response_code(500); echo "ERR"; exit; }

$quarto_id = intval($_POST['quarto_id'] ?? 0);
$carac_id = intval($_POST['caracteristica_id'] ?? 0);
if ($quarto_id <= 0 || $carac_id <= 0) { http_response_code(400); echo "ERR"; exit; }

$stmt = $con->prepare("INSERT IGNORE INTO caracteristicas_quartos (quarto_id, caracteristica_id) VALUES (?, ?)");
$stmt->bind_param("ii", $quarto_id, $carac_id);
$stmt->execute();
echo "OK";
