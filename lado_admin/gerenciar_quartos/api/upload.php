<?php

error_reporting(E_ALL);
ini_set('display_errors', 1);

// Caminho físico correto da pasta imagens
$folder = __DIR__ . "/../../../imagens/";

// Cria pasta se não existir
if (!is_dir($folder)) {
    mkdir($folder, 0777, true);
}

if (!isset($_FILES["image"])) {
    echo json_encode(["success" => false, "error" => "Nenhum arquivo enviado"]);
    exit;
}

$temp = $_FILES["image"]["tmp_name"];
$originalName = $_FILES["image"]["name"];

// extensão original
$ext = strtolower(pathinfo($originalName, PATHINFO_EXTENSION));

// extensões permitidas
$allowed = ["jpg", "jpeg", "png", "webp"];
if (!in_array($ext, $allowed)) {
    echo json_encode(["success" => false, "error" => "Formato não permitido"]);
    exit;
}

// nome único
$name = uniqid("img_") . "." . $ext;

// caminho físico final
$destino = $folder . $name;

// caminho web (para o navegador)
$webPath = "/AlbergueAlmeida/imagens/" . $name;

// salva o arquivo
if (move_uploaded_file($temp, $destino)) {
    echo json_encode([
        "success" => true,
        "path" => $webPath
    ]);
    exit;
}

echo json_encode(["success" => false, "error" => "Erro ao mover arquivo"]);
exit;
