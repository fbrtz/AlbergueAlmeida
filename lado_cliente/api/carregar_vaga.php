<?php
require_once '../../DATABASE/db_connect.php';
header('Content-Type: application/json; charset=utf-8');

try {
    $pdo = db_connect();
    $vaga_id = isset($_GET['vaga_id']) ? intval($_GET['vaga_id']) : 0;
    
    if (!$vaga_id) {
        http_response_code(400);
        echo json_encode(['error' => 'missing_vaga_id']);
        exit;
    }

    $sql = "SELECT v.*, q.id as quarto_id, q.titulo, q.descricao, q.preco_base, q.img0, q.img1, q.img2 
            FROM vagas v 
            JOIN quartos q ON q.id = v.quarto_id 
            WHERE v.id = ? LIMIT 1";
    $stmt = $pdo->prepare($sql);
    $stmt->execute([$vaga_id]);
    $row = $stmt->fetch(PDO::FETCH_ASSOC);
    
    if (!$row) {
        http_response_code(404);
        echo json_encode(['error' => 'not_found']);
        exit;
    }

    // Format vaga
    $vaga = [
        'id' => intval($row['id']),
        'quarto_id' => intval($row['quarto_id']),
        'nome' => $row['nome'],
        'adicional' => floatval($row['adicional']),
        'disponivel' => boolval($row['disponivel'])
    ];

    // Format quarto
    $imagens = [];
    if (!empty($row['img0'])) $imagens[] = $row['img0'];
    if (!empty($row['img1'])) $imagens[] = $row['img1'];
    if (!empty($row['img2'])) $imagens[] = $row['img2'];
    if (empty($imagens)) $imagens[] = 'https://via.placeholder.com/800x500?text=Sem+Imagem';

    $quarto = [
        'id' => intval($row['quarto_id']),
        'titulo' => $row['titulo'],
        'descricao' => $row['descricao'],
        'preco_base' => floatval($row['preco_base']),
        'imagens' => $imagens,
        'avaliacao' => 8.5  // Valor padrão
    ];

    echo json_encode(['vaga' => $vaga, 'quarto' => $quarto]);
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['error' => $e->getMessage()]);
}

?>
