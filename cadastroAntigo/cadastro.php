<?php

// CONEXÃO
$servername = "localhost";
$username = "root";
$password = "";
$dbname = "albergue_almeida"; 

$conn = new mysqli($servername, $username, $password, $dbname);

// erro de conexão
if ($conn->connect_error) {
    die("Erro de conexão: " . $conn->connect_error);
}

// PEGANDO OS DADOS DO FORM
$nome  = $_POST["nome"];
$email = $_POST["email"];
$senha = $_POST["senha"];

if(!$nome || !$email || !$senha){
    echo "Preencha todos os campos.";
    exit;
}

// VERIFICAR EMAIL EXISTENTE

$sql = $conn->prepare("SELECT id FROM usuarios WHERE email = ?");
$sql->bind_param("s", $email);
$sql->execute();
$sql->store_result();

if($sql->num_rows > 0){
    echo "Email já cadastrado.";
    exit;
}

// INSERIR USUÁRIO

$hash = password_hash($senha, PASSWORD_DEFAULT);

$insert = $conn->prepare(
    "INSERT INTO usuarios (nome, email, senha, funcao) VALUES (?, ?, ?, 'cliente')"
);

$insert->bind_param("sss", $nome, $email, $hash);

if($insert->execute()){
    echo "sucesso";
} else {
    echo "Erro ao cadastrar.";
}

$conn->close();

?>
