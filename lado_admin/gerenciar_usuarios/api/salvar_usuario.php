<?php
header("Content-Type: application/json");
$con = new mysqli("localhost","root","","albergue_almeida");
if ($con->connect_error) { http_response_code(500); echo json_encode(["erro"=>"conn"]); exit; }

$id = isset($_POST['id']) && $_POST['id'] !== "" ? intval($_POST['id']) : 0;
$nome = trim($_POST['nome'] ?? "");
$cpf = preg_replace('/\D/','', $_POST['cpf'] ?? "");
$nascimento = $_POST['nascimento'] ?? null;
$email = trim($_POST['email'] ?? "");
$funcao = $_POST['funcao'] ?? "cliente";
$status = $_POST['status'] ?? "ativo";
$nova_senha = $_POST['nova_senha'] ?? null;

// basic validation
if (!$nome || !$email) {
    echo json_encode(["erro"=>"Nome e email são obrigatórios."]);
    exit;
}
if ($cpf && strlen($cpf) !== 11) {
    echo json_encode(["erro"=>"CPF deve conter 11 dígitos."]);
    exit;
}

// unique checks (email, cpf)
if ($id) {
    // update - ensure no other user uses same email/cpf
    $stmt = $con->prepare("SELECT id FROM usuarios WHERE (email = ? OR cpf = ?) AND id != ?");
    $stmt->bind_param("ssi", $email, $cpf, $id);
    $stmt->execute();
    $r = $stmt->get_result();
    if ($r->num_rows > 0) {
        echo json_encode(["erro"=>"Email ou CPF já em uso por outro usuário."]);
        exit;
    }

    // build update
    $fields = [];
    $params = [];
    $types = "";

    $fields[] = "nome = ?"; $types.="s"; $params[] = $nome;
    $fields[] = "cpf = ?"; $types.="s"; $params[] = $cpf;
    $fields[] = "nascimento = ?"; $types.="s"; $params[] = $nascimento;
    $fields[] = "email = ?"; $types.="s"; $params[] = $email;
    $fields[] = "funcao = ?"; $types.="s"; $params[] = $funcao;
    $fields[] = "status = ?"; $types.="s"; $params[] = $status;

    if ($nova_senha && strlen($nova_senha) >= 6) {
        $hash = password_hash($nova_senha, PASSWORD_DEFAULT);
        $fields[] = "senha = ?";
        $types .= "s";
        $params[] = $hash;
    }

    $types .= "i";
    $params[] = $id;

    $sql = "UPDATE usuarios SET " . implode(", ", $fields) . " WHERE id = ?";
    $stmt = $con->prepare($sql);
    if ($stmt === false) {
        echo json_encode(["erro"=>$con->error]);
        exit;
    }
    $stmt->bind_param($types, ...$params);
    $ok = $stmt->execute();
    if (!$ok) {
        echo json_encode(["erro"=>$stmt->error]);
    } else {
        echo json_encode(["status"=>"OK","id"=>$id]);
    }
    exit;
} else {
    // create - ensure email/cpf not in use
    $stmt = $con->prepare("SELECT id FROM usuarios WHERE email = ? OR cpf = ?");
    $stmt->bind_param("ss", $email, $cpf);
    $stmt->execute();
    $r = $stmt->get_result();
    if ($r->num_rows > 0) {
        echo json_encode(["erro"=>"Email ou CPF já cadastrado."]);
        exit;
    }

    // password is required on create? we'll require nova_senha on create
    if (!$nova_senha || strlen($nova_senha) < 6) {
        echo json_encode(["erro"=>"Senha inicial obrigatória (mín 6 caracteres)."]);
        exit;
    }
    $hash = password_hash($nova_senha, PASSWORD_DEFAULT);

    $stmt = $con->prepare("INSERT INTO usuarios (nome, cpf, nascimento, email, senha, status, funcao) VALUES (?,?,?,?,?,?,?)");
    $stmt->bind_param("sssssss", $nome, $cpf, $nascimento, $email, $hash, $status, $funcao);
    $ok = $stmt->execute();
    if (!$ok) {
        echo json_encode(["erro"=>$stmt->error]);
    } else {
        echo json_encode(["status"=>"OK","id"=>$con->insert_id]);
    }
    exit;
}
