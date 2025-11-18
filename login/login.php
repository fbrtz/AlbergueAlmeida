<?php
header("Content-Type: text/plain");

// Dados de conexão
$host = "localhost";
$user = "root";
$pass = "";
$db = "albergue_almeida";

$con = new mysqli($host, $user, $pass, $db);

if ($con->connect_error) {
    die("Erro na conexão");
}

$email = $_POST["email"] ?? "";
$senha = $_POST["senha"] ?? "";

$sql = $con->prepare("SELECT funcao, senha FROM usuarios WHERE email = ?");
$sql->bind_param("s", $email);
$sql->execute();
$result = $sql->get_result();

if ($result->num_rows === 0) {
    echo "E-mail ou senha incorretos";
    exit;
}

$dados = $result->fetch_assoc();

// HASH OU TEXTO PURO
$senhaBanco = $dados["senha"];

$isHash = strlen($senhaBanco) > 20; // hash normalmente tem 60

$validado =
    ($isHash && password_verify($senha, $senhaBanco)) ||
    (!$isHash && $senha === $senhaBanco);

if (!$validado) {
    echo "E-mail ou senha incorretos";
    exit;
}


if ($dados["funcao"] === "administrador") {
    echo "adm";
} else {
    echo "cliente";
}

?>
