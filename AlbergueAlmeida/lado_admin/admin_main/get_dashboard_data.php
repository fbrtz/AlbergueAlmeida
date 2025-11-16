<?php
header("Content-Type: application/json");

// Conexão
$host = "localhost";
$user = "root";
$pass = "";
$db = "albergue_almeida";

$con = new mysqli($host, $user, $pass, $db);
if ($con->connect_error) {
    die(json_encode(["erro" => "Falha na conexão"]));
}

// Total de vagas
$sql1 = $con->query("SELECT COUNT(*) AS total FROM vagas");
$totalVagas = $sql1->fetch_assoc()["total"];

// Vagas disponíveis
$sql2 = $con->query("SELECT COUNT(*) AS disp FROM vagas WHERE disponivel = 1");
$vagasDisponiveis = $sql2->fetch_assoc()["disp"];

$sql3 = $con->query("
    SELECT COUNT(*) AS ativas 
    FROM reservas 
    WHERE status = 'confirmado'
    AND inicio_periodo <= NOW()
");
$reservasAtivas = $sql3->fetch_assoc()['ativas'];

// % vagas ocupadas
$totalOcupadas = $totalVagas - $vagasDisponiveis;
$porcentagem = ($totalVagas > 0)
    ? round(($totalOcupadas / $totalVagas) * 100, 1)
    : 0;

echo json_encode([
    "total_vagas" => $totalVagas,
    "vagas_disponiveis" => $vagasDisponiveis,
    "reservas_ativas" => $reservasAtivas,
    "porcentagem_ocupadas" => $porcentagem
]);
?>
