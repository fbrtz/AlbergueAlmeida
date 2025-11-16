<?php
header("Content-Type: text/plain");

// Dados de conexão
$host = "localhost";
$user = "root";        // ou hostel_user
$pass = "";            // ou 123456 se você criou
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

if ($senha !== $dados["senha"]) {
    echo "E-mail ou senha incorretos";
    exit;
}

if ($dados["funcao"] === "administrador") {
    echo "adm";
} else {
    echo "cliente";
}

?>
