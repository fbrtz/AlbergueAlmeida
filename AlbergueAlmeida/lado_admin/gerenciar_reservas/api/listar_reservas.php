<?php
error_reporting(E_ALL);
ini_set('display_errors', 1);

header("Content-Type: application/json; charset=utf-8");

// Conexão no estilo XAMPP
$con = new mysqli("localhost", "root", "", "albergue_almeida");
if ($con->connect_error) {
    http_response_code(500);
    echo json_encode(["erro" => "Falha na conexão: " . $con->connect_error]);
    exit;
}

// Recebe o quarto_id, opcional
$quarto_id = isset($_GET['quarto_id']) ? intval($_GET['quarto_id']) : 0;

$sql = "
    SELECT 
        r.id,
        r.vaga_id,
        v.nome AS vaga_nome,
        v.quarto_id,
        q.titulo AS quarto_titulo,
        r.hospede_id,
        u.nome AS hospede_nome,
        r.inicio_periodo,
        r.fim_periodo,
        r.status,
        r.valor_total
    FROM reservas r
    JOIN vagas v ON r.vaga_id = v.id
    JOIN quartos q ON v.quarto_id = q.id
    JOIN usuarios u ON r.hospede_id = u.id
";

if ($quarto_id) {
    $sql .= " WHERE q.id = " . $quarto_id;
}

$sql .= " ORDER BY q.titulo ASC, r.inicio_periodo ASC";

$res = $con->query($sql);

if (!$res) {
    http_response_code(500);
    echo json_encode(["erro" => $con->error, "sql" => $sql]);
    exit;
}

$out = [];

while ($row = $res->fetch_assoc()) {
    // Apenas garantindo tipos corretos
    $row['id'] = intval($row['id']);
    $row['vaga_id'] = intval($row['vaga_id']);
    $row['quarto_id'] = intval($row['quarto_id']);
    $row['hospede_id'] = intval($row['hospede_id']);
    $row['valor_total'] = floatval($row['valor_total']);

    $out[] = $row;
}

// Retorno final
echo json_encode($out, JSON_UNESCAPED_UNICODE);
