<?php
header("Content-Type: application/json");
$con = new mysqli("localhost","root","","albergue_almeida");
if ($con->connect_error) { http_response_code(500); echo json_encode([]); exit; }

// parâmetros
$filtrar = isset($_GET["apenas_com_espaco"]) && $_GET["apenas_com_espaco"] == "1";
$quartoAtual = isset($_GET["quarto_atual"]) ? intval($_GET["quarto_atual"]) : 0;

// SQL base
$sql = "SELECT * FROM quartos ORDER BY id DESC";
$result = $con->query($sql);

$quartos = [];
while ($q = $result->fetch_assoc()) {
    $quartos[] = $q;
}

// Se não for filtrar, devolve tudo (modo compatível com o resto do sistema)
if (!$filtrar) {
    echo enrich($quartos, $con);
    exit;
}

// --- Coleta contagem de vagas ocupadas ---
$r = $con->query("SELECT quarto_id, COUNT(*) AS usadas FROM vagas GROUP BY quarto_id");
$ocup = [];
while ($o = $r->fetch_assoc()) {
    $ocup[ $o['quarto_id'] ] = intval($o['usadas']);
}

// --- Filtra apenas quartos com espaço, exceto o quarto atual ---
$filtrados = [];

foreach ($quartos as $q) {
    $id = intval($q['id']);
    $usadas = $ocup[$id] ?? 0;
    $total = intval($q['total_vagas']);

    if ($id === $quartoAtual) {
        // Sempre incluir quarto atual, mesmo cheio
        $filtrados[] = $q;
        continue;
    }

    if ($usadas < $total) {
        $filtrados[] = $q;
    }
}

// Agora enriquecemos com imagens + características
echo enrich($filtrados, $con);
exit;

// ================================================
// Função que adiciona imagens e características
// ================================================
function enrich($quartos, $con) {
    $out = [];

    foreach ($quartos as $q) {
        $id = intval($q['id']);

        // imagens
        $imgs = [];
        if (!empty($q['img0'])) $imgs[] = $q['img0'];
        if (!empty($q['img1'])) $imgs[] = $q['img1'];
        if (!empty($q['img2'])) $imgs[] = $q['img2'];
        if (count($imgs) === 0)
            $imgs[] = "https://via.placeholder.com/800x500?text=Sem+Imagem";

        $q['imagens'] = $imgs;

        // características
        $car = [];
        $cRes = $con->query("
            SELECT c.id, c.nome
            FROM caracteristicas_quartos cq
            JOIN caracteristicas c ON c.id = cq.caracteristica_id
            WHERE cq.quarto_id = $id
            ORDER BY c.nome
        ");

        if ($cRes) {
            while ($c = $cRes->fetch_assoc()) {
                $car[] = $c;
            }
        }

        $q['caracteristicas'] = $car;

        $out[] = $q;
    }

    return json_encode($out);
}
