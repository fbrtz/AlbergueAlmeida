<?php
$con = new mysqli("localhost","root","","albergue_almeida");
$vaga_id = intval($_POST['vaga_id'] ?? 0);
$carac_id = intval($_POST['caracteristica_id'] ?? 0);
if ($vaga_id <=0 || $carac_id<=0) { http_response_code(400); echo "ERR"; exit; }
$con->query("INSERT IGNORE INTO caracteristicas_vagas (vaga_id, caracteristica_id) VALUES ($vaga_id, $carac_id)");
echo "OK";
