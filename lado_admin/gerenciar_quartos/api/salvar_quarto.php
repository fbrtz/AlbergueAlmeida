<?php
header("Content-Type: application/json");
$con = new mysqli("localhost","root","","albergue_almeida");
if ($con->connect_error) { http_response_code(500); echo json_encode(["erro"=>"db"]); exit; }

// receber campos
$id = isset($_POST['id']) ? intval($_POST['id']) : 0;
$titulo = $_POST['titulo'] ?? '';
$descricao = $_POST['descricao'] ?? '';
$total_vagas = isset($_POST['total_vagas']) ? intval($_POST['total_vagas']) : 0;
$preco_base = isset($_POST['preco_base']) ? floatval($_POST['preco_base']) : 0.0;
$img0 = $_POST['img0'] ?? '';
$img1 = $_POST['img1'] ?? '';
$img2 = $_POST['img2'] ?? '';

// caracteristicas como JSON string ou array
$carac_raw = $_POST['caracteristicas'] ?? '[]';
$caracteristicas = json_decode($carac_raw, true);
if (!is_array($caracteristicas)) $caracteristicas = [];

if ($id <= 0) {
    // criar novo
    $stmt = $con->prepare("INSERT INTO quartos (titulo, descricao, total_vagas, preco_base, img0, img1, img2) VALUES (?, ?, ?, ?, ?, ?, ?)");
    $stmt->bind_param("ssidsii", $titulo, $descricao, $total_vagas, $preco_base, $img0, $img1, $img2);
    // ajuste bind - object types: need strings for images and types; to avoid mismatch, cast preco to string
    // simpler: use a different bind types set:
    $stmt = $con->prepare("INSERT INTO quartos (titulo, descricao, total_vagas, preco_base, img0, img1, img2) VALUES (?, ?, ?, ?, ?, ?, ?)");
    $stmt->bind_param("ssidsis", $titulo, $descricao, $total_vagas, $preco_base, $img0, $img1, $img2);
    if (!$stmt->execute()) { echo json_encode(["erro"=>$stmt->error]); exit; }
    $id = $con->insert_id;

    // vincular caracteristicas
    foreach ($caracteristicas as $cid) {
        $cid = intval($cid);
        if ($cid <= 0) continue;
        $ins = $con->prepare("INSERT IGNORE INTO caracteristicas_quartos (quarto_id, caracteristica_id) VALUES (?, ?)");
        $ins->bind_param("ii", $id, $cid);
        $ins->execute();
    }

    echo json_encode(["status"=>"OK", "id"=>$id]);
    exit;
} else {
    // atualizar quarto
    $stmt = $con->prepare("UPDATE quartos SET titulo=?, descricao=?, total_vagas=?, preco_base=?, img0=?, img1=?, img2=? WHERE id=?");
    $stmt->bind_param("ssidsssi", $titulo, $descricao, $total_vagas, $preco_base, $img0, $img1, $img2, $id);
    if (!$stmt->execute()) { echo json_encode(["erro"=>$stmt->error]); exit; }

    // sincronizar caracteristicas: obter atuais
    $cur = $con->prepare("SELECT caracteristica_id FROM caracteristicas_quartos WHERE quarto_id = ?");
    $cur->bind_param("i", $id);
    $cur->execute();
    $r = $cur->get_result();
    $exist = [];
    while ($row = $r->fetch_assoc()) $exist[] = intval($row['caracteristica_id']);

    $toAdd = array_diff($caracteristicas, $exist);
    $toRemove = array_diff($exist, $caracteristicas);

    foreach ($toAdd as $cid) {
        $cid = intval($cid); if ($cid <= 0) continue;
        $ins = $con->prepare("INSERT IGNORE INTO caracteristicas_quartos (quarto_id, caracteristica_id) VALUES (?, ?)");
        $ins->bind_param("ii", $id, $cid);
        $ins->execute();
    }
    foreach ($toRemove as $cid) {
        $cid = intval($cid); if ($cid <= 0) continue;
        $del = $con->prepare("DELETE FROM caracteristicas_quartos WHERE quarto_id = ? AND caracteristica_id = ?");
        $del->bind_param("ii", $id, $cid);
        $del->execute();
    }

    echo json_encode(["status"=>"OK"]);
    exit;
}
