<?php
require_once '../../DATABASE/db_connect.php';
header('Content-Type: application/json; charset=utf-8');

try {
    $pdo = db_connect();
    $checkIn = $_GET['checkIn'] ?? null;
    $checkOut = $_GET['checkOut'] ?? null;
    $guests = isset($_GET['guests']) ? intval($_GET['guests']) : 1;

    /*
    |--------------------------------------------------------------------------
    | CORREÇÃO CRÍTICA: aceitar múltiplas caracteristicas[]
    |--------------------------------------------------------------------------
    */
    $caracteristicasFilter = [];

    if (isset($_GET['caracteristicas'])) {

        if (is_array($_GET['caracteristicas'])) {
            $caracteristicasFilter = array_map('intval', $_GET['caracteristicas']);
        } else if (is_string($_GET['caracteristicas'])) {
            $caracteristicasFilter = array_map('intval', explode(',', $_GET['caracteristicas']));
        }

        $caracteristicasFilter = array_filter($caracteristicasFilter);
    }

    /*
    |--------------------------------------------------------------------------
    | Buscar somente quartos que possuem TODAS as características marcadas
    |--------------------------------------------------------------------------
    */
    if (!empty($caracteristicasFilter)) {

        $placeholders = implode(',', array_fill(0, count($caracteristicasFilter), '?'));

        $sql = "
            SELECT q.*
            FROM quartos q
            INNER JOIN caracteristicas_quartos cq ON q.id = cq.quarto_id
            INNER JOIN caracteristicas c ON cq.caracteristica_id = c.id
            WHERE c.tipo IN ('quarto','ambos')
            AND cq.caracteristica_id IN ($placeholders)
            GROUP BY q.id
            HAVING COUNT(DISTINCT cq.caracteristica_id) = " . count($caracteristicasFilter) . "
            ORDER BY q.preco_base ASC
        ";

        $params = $caracteristicasFilter;

    } else {
        // Sem filtros
        $sql = "SELECT q.* FROM quartos q ORDER BY q.preco_base ASC";
        $params = [];
    }

    $stmt = $pdo->prepare($sql);
    $stmt->execute($params);
    $quartos = $stmt->fetchAll(PDO::FETCH_ASSOC);


    /*
    |--------------------------------------------------------------------------
    | Carregar VAGAS disponíveis + características
    |--------------------------------------------------------------------------
    */
    $quartosComVagas = [];

    foreach ($quartos as $quarto) {

        $vagaQuery = "SELECT v.id, v.nome, v.adicional FROM vagas v WHERE v.quarto_id = ?";
        $vagaParams = [$quarto['id']];

        if ($checkIn && $checkOut) {

            $inDateTime = $checkIn . ' 00:00:00';
            $outDateTime = $checkOut . ' 00:00:00';

            $vagaQuery .= "
                AND v.id NOT IN (
                    SELECT r.vaga_id
                    FROM reservas r
                    WHERE NOT (r.fim_periodo <= ? OR r.inicio_periodo >= ?)
                    AND r.status != 'cancelado'
                )
            ";

            $vagaParams[] = $inDateTime;
            $vagaParams[] = $outDateTime;
        }

        $vagaStmt = $pdo->prepare($vagaQuery);
        $vagaStmt->execute($vagaParams);
        $vagas = $vagaStmt->fetchAll(PDO::FETCH_ASSOC);

        if (count($vagas) === 0) continue;

        // Características das vagas
        foreach ($vagas as &$vaga) {
            $caracQuery = "
                SELECT c.id, c.nome
                FROM caracteristicas c
                INNER JOIN caracteristicas_vagas cv ON c.id = cv.caracteristica_id
                WHERE cv.vaga_id = ?
                AND c.tipo IN ('vaga','ambos')
                ORDER BY c.nome ASC
            ";

            $caracStmt = $pdo->prepare($caracQuery);
            $caracStmt->execute([$vaga['id']]);
            $vaga['caracteristicas'] = $caracStmt->fetchAll(PDO::FETCH_ASSOC);

            $vaga['adicional'] = floatval($vaga['adicional']);
        }

        // Características do quarto
        $caracQQuery = "
            SELECT c.id, c.nome
            FROM caracteristicas c
            INNER JOIN caracteristicas_quartos cq ON c.id = cq.caracteristica_id
            WHERE cq.quarto_id = ?
            AND c.tipo IN ('quarto','ambos')
            ORDER BY c.nome ASC
        ";

        $caracQStmt = $pdo->prepare($caracQQuery);
        $caracQStmt->execute([$quarto['id']]);
        $quarto['caracteristicas'] = $caracQStmt->fetchAll(PDO::FETCH_ASSOC);

        // Imagens
        $imagens = [];
        if (!empty($quarto['img0'])) $imagens[] = $quarto['img0'];
        if (!empty($quarto['img1'])) $imagens[] = $quarto['img1'];
        if (!empty($quarto['img2'])) $imagens[] = $quarto['img2'];
        if (empty($imagens)) $imagens[] = 'https://via.placeholder.com/800x500?text=Sem+Imagem';

        $quarto['imagens'] = $imagens;

        $quarto['preco_base'] = floatval($quarto['preco_base']);
        $quarto['total_vagas'] = intval($quarto['total_vagas']);

        $quarto['vagas_disponiveis'] = $vagas;

        $quartosComVagas[] = $quarto;
    }

    echo json_encode([
        "success" => true,
        "quartos" => $quartosComVagas
    ], JSON_UNESCAPED_SLASHES);

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'error' => $e->getMessage()
    ]);
}
