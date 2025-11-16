<?php
header("Content-Type: application/json");
$con = new mysqli("localhost","root","","albergue_almeida");
if ($con->connect_error) { http_response_code(500); echo json_encode(["erro"=>"conn"]); exit; }

$id = isset($_POST['id']) && $_POST['id'] !== "" ? intval($_POST['id']) : 0;
$quarto_id = intval($_POST['quarto_id'] ?? 0);
$nome = $_POST['nome'] ?? "";
$adicional = floatval($_POST['adicional'] ?? 0);
$disponivel = isset($_POST['disponivel']) ? intval($_POST['disponivel']) : 1;
$caracteristicas = [];
if (isset($_POST['caracteristicas'])) {
    $caracteristicas = json_decode($_POST['caracteristicas'], true);
    if (!is_array($caracteristicas)) $caracteristicas = [];
}

if ($id > 0) {
    $stmt = $con->prepare("UPDATE vagas SET quarto_id=?, nome=?, adicional=?, disponivel=? WHERE id=?");
    $stmt->bind_param("isddi",$quarto_id,$nome,$adicional,$disponivel,$id);
    $ok = $stmt->execute();
} else {
    $stmt = $con->prepare("INSERT INTO vagas (quarto_id,nome,adicional,disponivel) VALUES (?,?,?,?)");
    $stmt->bind_param("isdi",$quarto_id,$nome,$adicional,$disponivel);
    $ok = $stmt->execute();
    if ($ok) $id = $con->insert_id;
}

if (!$ok) {
    echo json_encode(["erro" => $con->error]);
    exit;
}

// sincronizar caracteristicas: remover as não presentes e inserir as novas
// primeiro pegar existentes
$existing = [];
$res = $con->query("SELECT caracteristica_id FROM caracteristicas_vagas WHERE vaga_id = $id");
while ($r = $res->fetch_assoc()) $existing[] = intval($r['caracteristica_id']);

$toAdd = array_diff($caracteristicas, $existing);
$toRemove = array_diff($existing, $caracteristicas);

foreach ($toAdd as $cid) {
    $cid = intval($cid);
    $con->query("INSERT IGNORE INTO caracteristicas_vagas (vaga_id, caracteristica_id) VALUES ($id, $cid)");
}
foreach ($toRemove as $cid) {
    $cid = intval($cid);
    $con->query("DELETE FROM caracteristicas_vagas WHERE vaga_id = $id AND caracteristica_id = $cid");
}

echo json_encode(["status"=>"OK","id"=>$id]);
