<?php
header("Content-Type: application/json");
$con = new mysqli("localhost","root","","albergue_almeida");
if ($con->connect_error) { http_response_code(500); echo json_encode(["erro"=>"conn"]); exit; }

// optional params
$q = isset($_GET['q']) ? trim($_GET['q']) : "";
$status = isset($_GET['status']) ? trim($_GET['status']) : "";
$funcao = isset($_GET['funcao']) ? trim($_GET['funcao']) : "";
$nasc_from = isset($_GET['nascimento_from']) ? $_GET['nascimento_from'] : "";
$nasc_to = isset($_GET['nascimento_to']) ? $_GET['nascimento_to'] : "";
$usuario_id = isset($_GET['usuario_id']) ? intval($_GET['usuario_id']) : 0;

$where = [];
$params = [];
$types = "";

// if specific id requested
if ($usuario_id) {
    $where[] = "u.id = ?";
    $types .= "i";
    $params[] = $usuario_id;
} else {
    if ($status) {
        $where[] = "u.status = ?";
        $types .= "s";
        $params[] = $status;
    }
    if ($funcao) {
        $where[] = "u.funcao = ?";
        $types .= "s";
        $params[] = $funcao;
    }
    if ($nasc_from) {
        $where[] = "u.nascimento >= ?";
        $types .= "s";
        $params[] = $nasc_from;
    }
    if ($nasc_to) {
        $where[] = "u.nascimento <= ?";
        $types .= "s";
        $params[] = $nasc_to;
    }
    if ($q) {
        // search name, email, cpf (cpf stored as digits)
        $where[] = "(u.nome LIKE ? OR u.email LIKE ? OR u.cpf LIKE ?)";
        $types .= "sss";
        $like = "%".$q."%";
        $params[] = $like;
        $params[] = $like;
        $params[] = $like;
    }
}

$sql = "SELECT u.id, u.nome, u.cpf, u.nascimento, u.email, u.status, u.funcao, u.criado_em, u.atualizado_em FROM usuarios u";
if (count($where)) {
    $sql .= " WHERE " . implode(" AND ", $where);
}
$sql .= " ORDER BY u.nome ASC";

$stmt = $con->prepare($sql);
if ($stmt === false) {
    echo json_encode(["erro"=>$con->error]);
    exit;
}
if (count($params)) {
    $stmt->bind_param($types, ...$params);
}
$stmt->execute();
$res = $stmt->get_result();
$out = [];
while ($row = $res->fetch_assoc()) {
    // do not return senha
    $out[] = $row;
}
echo json_encode($out);
