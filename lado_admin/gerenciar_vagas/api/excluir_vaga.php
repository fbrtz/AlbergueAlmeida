<?php
$con = new mysqli("localhost","root","","albergue_almeida");
$id = isset($_POST['id']) ? intval($_POST['id']) : 0;
if ($id <= 0) { http_response_code(400); echo "ERR"; exit; }
$con->query("DELETE FROM vagas WHERE id = $id");
echo "OK";
