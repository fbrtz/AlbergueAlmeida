<?php
session_start();
header("Content-Type: application/json; charset=utf-8");

// Dados de conexão
$host = "localhost";
$user = "root";
$pass = "";
$db = "albergue_almeida";

$con = new mysqli($host, $user, $pass, $db);

if ($con->connect_error) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Erro na conexão com o banco']);
    exit;
}

$email = $_POST["email"] ?? "";
$senha = $_POST["senha"] ?? "";

 $sql = $con->prepare("SELECT id, nome, nascimento, funcao, senha FROM usuarios WHERE email = ?");
$sql->bind_param("s", $email);
$sql->execute();
$result = $sql->get_result();

if ($result->num_rows === 0) {
    http_response_code(401);
    echo json_encode(['success' => false, 'message' => 'E-mail ou senha incorretos']);
    exit;
}

 $dados = $result->fetch_assoc();
 $userId = $dados['id'];
 $userRole = $dados['funcao'];
 $userName = $dados['nome'] ?? '';
 $userBirth = $dados['nascimento'] ?? null;

// HASH OU TEXTO PURO
$senhaBanco = $dados["senha"];

$isHash = strlen($senhaBanco) > 20; // hash normalmente tem 60

$validado =
    ($isHash && password_verify($senha, $senhaBanco)) ||
    (!$isHash && $senha === $senhaBanco);

if (!$validado) {
    http_response_code(401);
    echo json_encode(['success' => false, 'message' => 'E-mail ou senha incorretos']);
    exit;
}

// Login bem-sucedido - registrar sessão e retornar dados do usuário
 $_SESSION['user_id'] = intval($userId);
 $_SESSION['user_role'] = $userRole;

 http_response_code(200);
 echo json_encode([
     'success' => true,
     'user_id' => intval($userId),
     'name' => $userName,
     'birth' => $userBirth,
     'role' => $userRole,
     'redirect' => ($userRole === "administrador") ? "../lado_admin/admin_main/adm_home.html" : "../lado_cliente/cliente_main/cliente_home.html"
 ]);
?>
