<?php

// CONEXÃO
$servername = "localhost";
$username   = "root";
$password   = "";
$dbname     = "albergue_almeida"; 

$conn = new mysqli($servername, $username, $password, $dbname);

if ($conn->connect_error) {
    die("Erro de conexão: " . $conn->connect_error);
}

// PEGANDO OS DADOS DO FORM
$nome        = trim($_POST["nome"] ?? "");
$email       = trim($_POST["email"] ?? "");
$cpf         = preg_replace('/\D/', '', $_POST["cpf"] ?? "");
$nascimento  = $_POST["nascimento"] ?? "";
$senha       = $_POST["senha"] ?? "";

// VALIDAR CAMPOS VAZIOS
if(!$nome || !$email || !$cpf || !$nascimento || !$senha){
    echo "Preencha todos os campos.";
    exit;
}

// VALIDAR CPF
if(strlen($cpf) !== 11 || !ctype_digit($cpf)){
    echo "CPF inválido.";
    exit;
}

// VALIDAR MAIOR DE IDADE
$dataNasc = DateTime::createFromFormat('Y-m-d', $nascimento);
$hoje     = new DateTime();

if(!$dataNasc){
    echo "Data de nascimento inválida.";
    exit;
}

$idade = $hoje->diff($dataNasc)->y;

if($idade < 18){
    echo "É necessário ter 18 anos ou mais.";
    exit;
}

// VALIDAR SENHA (min 6, max seguro 72)
if(strlen($senha) < 6){
    echo "A senha deve conter ao menos 6 caracteres.";
    exit;
}

if(strlen($senha) > 72){
    echo "A senha não pode ultrapassar 72 caracteres.";
    exit;
}

/* BLOQUEAR SENHAS FRACAS tirei ja tava me estressando
$senhasProibidas = ["123456", "12345678", "password", "qwerty", "111111"];

if(in_array($senha, $senhasProibidas)){
    echo "Escolha uma senha mais segura.";
    exit;
}
*/

// VERIFICAR EMAIL EXISTENTE
$sql = $conn->prepare("SELECT id FROM usuarios WHERE email = ?");
$sql->bind_param("s", $email);
$sql->execute();
$sql->store_result();

if($sql->num_rows > 0){
    echo "Email já cadastrado.";
    exit;
}

// VERIFICAR CPF EXISTENTE
$sqlCpf = $conn->prepare("SELECT id FROM usuarios WHERE cpf = ?");
$sqlCpf->bind_param("s", $cpf);
$sqlCpf->execute();
$sqlCpf->store_result();

if($sqlCpf->num_rows > 0){
    echo "CPF já cadastrado.";
    exit;
}

// HASH SEGURO (BCrypt)
$hash = password_hash($senha, PASSWORD_DEFAULT);

// INSERIR USUÁRIO
$insert = $conn->prepare(
    "INSERT INTO usuarios (nome, email, cpf, nascimento, senha, funcao) 
     VALUES (?, ?, ?, ?, ?, 'cliente')"
);

$insert->bind_param("sssss", $nome, $email, $cpf, $nascimento, $hash);

if($insert->execute()){
    echo "sucesso";
} else {
    echo "Erro ao cadastrar.";
}

$conn->close();

?>
