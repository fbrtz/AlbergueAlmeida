<?php
error_reporting(E_ALL);
ini_set('display_errors', 1);
header("Content-Type: application/json; charset=utf-8");

$con = new mysqli("localhost", "root", "", "albergue_almeida");
if ($con->connect_error) {
    echo json_encode(["erro" => "Falha na conexão"]);
    exit;
}

$id = intval($_POST['id'] ?? 0);
$inicio = $_POST['inicio_periodo'] ?? '';
$fim = $_POST['fim_periodo'] ?? '';
$valor = floatval($_POST['valor_total'] ?? 0);
$status = $_POST['status'] ?? '';
$vaga_id = intval($_POST['vaga_id'] ?? 0);

$permit = ['pendente','confirmado','cancelado'];

if ($id <= 0 || $vaga_id <= 0 || !in_array($status, $permit)) {
    echo json_encode(["erro" => "Dados inválidos"]);
    exit;
}

// ------- 1) Obter dados atuais da reserva -------
$res = $con->query("
    SELECT r.*, v.quarto_id
    FROM reservas r
    JOIN vagas v ON r.vaga_id = v.id
    WHERE r.id = $id
");

if (!$res || $res->num_rows == 0) {
    echo json_encode(["erro" => "Reserva não encontrada"]);
    exit;
}

$atual = $res->fetch_assoc();
$quarto_original = intval($atual['quarto_id']);

// ------- 2) Verificar se nova vaga pertence ao mesmo quarto -------
$res2 = $con->query("SELECT quarto_id FROM vagas WHERE id = $vaga_id");

if (!$res2 || $res2->num_rows == 0) {
    echo json_encode(["erro" => "A vaga selecionada não existe"]);
    exit;
}

$row2 = $res2->fetch_assoc();

if (intval($row2['quarto_id']) !== $quarto_original) {
    echo json_encode(["erro" => "A vaga selecionada pertence a outro quarto"]);
    exit;
}

// ------- 3) Checar conflitos de reserva na nova vaga -------
$check = $con->prepare("
    SELECT id 
    FROM reservas
    WHERE vaga_id = ? 
      AND id <> ?
      AND (
            (inicio_periodo <= ? AND fim_periodo >= ?) OR
            (inicio_periodo <= ? AND fim_periodo >= ?) OR
            (? <= inicio_periodo AND ? >= inicio_periodo)
          )
");

$check->bind_param("iissssii",
    $vaga_id, 
    $id,
    $inicio, $inicio,
    $fim, $fim,
    $inicio, $fim
);

$check->execute();
$conf = $check->get_result();

if ($conf->num_rows > 0) {
    echo json_encode(["erro" => "A vaga já está ocupada neste período"]);
    exit;
}

// ------- 4) Atualizar reserva -------
$stmt = $con->prepare("
    UPDATE reservas
    SET vaga_id = ?, 
        inicio_periodo = ?, 
        fim_periodo = ?, 
        valor_total = ?, 
        status = ?, 
        atualizado_em = NOW()
    WHERE id = ?
");

$stmt->bind_param("issdsi", 
    $vaga_id,
    $inicio,
    $fim,
    $valor,
    $status,
    $id
);

if ($stmt->execute()) {
    echo json_encode(["status" => "OK"]);
} else {
    echo json_encode(["erro" => $stmt->error]);
}
