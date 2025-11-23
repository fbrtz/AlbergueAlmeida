<?php
require_once '../../DATABASE/db_connect.php';
header('Content-Type: application/json; charset=utf-8');

try {
    $pdo = db_connect();
    $sql = 'SELECT q.id, q.titulo, q.descricao, q.preco_base, q.img0, q.img1, q.img2, q.total_vagas
            FROM quartos q
            ORDER BY q.id';
    $stmt = $pdo->prepare($sql);
    $stmt->execute();
    $quartos = $stmt->fetchAll(PDO::FETCH_ASSOC);

    // Formata dados para retorno
    foreach ($quartos as &$quarto) {
        // Cria array de imagens a partir dos campos img0, img1, img2
        $imagens = [];
        if ($quarto['img0']) $imagens[] = $quarto['img0'];
        if ($quarto['img1']) $imagens[] = $quarto['img1'];
        if ($quarto['img2']) $imagens[] = $quarto['img2'];
        
        $quarto['imagens'] = $imagens;
        $quarto['avaliacao'] = 8.5; // Valor padrão (pode ser adicionado à tabela depois)
        
        // Remove campos individuais de imagem
        unset($quarto['img0'], $quarto['img1'], $quarto['img2']);
    }

    echo json_encode(['success' => true, 'quartos' => $quartos]);
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'error' => $e->getMessage()]);
}
