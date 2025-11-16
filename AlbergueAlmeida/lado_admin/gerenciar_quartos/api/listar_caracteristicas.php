<?php
header("Content-Type: application/json");
$con = new mysqli("localhost","root","","albergue_almeida");
if ($con->connect_error) { http_response_code(500); echo json_encode([]); exit; }

$q = isset($_GET['q']) ? trim($_GET['q']) : '';
$tipo = isset($_GET['tipo']) ? $_GET['tipo'] : 'ambos';

// Query que retorna características do tipo informado + características "ambos"
$sql = "SELECT id, nome, tipo 
        FROM caracteristicas 
        WHERE (tipo = 'ambos' OR tipo = ?)";

if ($q !== '') {
    $sql .= " AND nome LIKE ?";
}

$sql .= " ORDER BY nome LIMIT 50";

$stmt = $con->prepare($sql);

if ($q !== '') {
    $like = "%$q%";
    $stmt->bind_param("ss", $tipo, $like);
} else {
    $stmt->bind_param("s", $tipo);
}

$stmt->execute();
$res = $stmt->get_result();

$out = [];
while ($row = $res->fetch_assoc()) {
    $out[] = $row;
}

echo json_encode($out);
