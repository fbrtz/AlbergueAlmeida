<?php
error_reporting(E_ALL);
ini_set('display_errors', 1);

header("Content-Type: application/json");

$con = new mysqli("localhost","root","","albergue_almeida");
if ($con->connect_error) {
    http_response_code(500);
    echo json_encode(["erro" => "Falha na conexão"]);
    exit;
}

$quarto_id = isset($_GET['quarto_id']) ? intval($_GET['quarto_id']) : 0;

$sql = "
    SELECT 
        v.*, 
        q.titulo AS quarto_titulo,
        q.preco_base AS quarto_preco_base,
        q.total_vagas AS quarto_total_vagas
    FROM vagas v
    JOIN quartos q ON v.quarto_id = q.id
";

if ($quarto_id) {
    $sql .= " WHERE v.quarto_id = " . $quarto_id;
}

$sql .= " ORDER BY q.id, v.id";

$res = $con->query($sql);

if (!$res) {
    echo json_encode(["erro" => $con->error, "sql" => $sql]);
    exit;
}

$out = [];

while ($row = $res->fetch_assoc()) {
    $vid = intval($row['id']);

    // buscar caracteristicas
    $cRes = $con->query("
        SELECT c.id, c.nome
        FROM caracteristicas_vagas cv
        JOIN caracteristicas c ON c.id = cv.caracteristica_id
        WHERE cv.vaga_id = $vid
    ");

    $car = [];
    if ($cRes) {
        while ($c = $cRes->fetch_assoc()) {
            $car[] = $c;
        }
    }

    $row['caracteristicas'] = $car;
    $out[] = $row;
}

echo json_encode($out);
    