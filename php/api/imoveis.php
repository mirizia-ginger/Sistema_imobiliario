<?php
/**
 * INTAKA VILLAGE — API de imóveis
 * GET /php/api/imoveis.php
 *
 * Parâmetros de pesquisa opcionais (RF4 / RF5):
 *   bairro      string  — pesquisa parcial por localização
 *   tipo        string  — "Moradia T2", "Apartamento T1", "todos", ...
 *   preco_max   float   — preço mensal máximo em MZN
 *   quartos     int     — número mínimo de quartos
 *   id          int     — devolve um único imóvel com toda a galeria
 */

declare(strict_types=1);

header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, OPTIONS');

require_once __DIR__ . '/../config.php';

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit;
}

try {
    $pdo = obterLigacaoBD();

    // ---- Pedido de um único imóvel (página de detalhe) ----
    if (!empty($_GET['id'])) {
        $id = (int) $_GET['id'];

        $stmt = $pdo->prepare('SELECT * FROM imoveis WHERE id = :id LIMIT 1');
        $stmt->execute([':id' => $id]);
        $imovel = $stmt->fetch();

        if (!$imovel) {
            responderJson(['sucesso' => false, 'erro' => 'Imóvel não encontrado.'], 404);
        }

        $imgStmt = $pdo->prepare('SELECT caminho, legenda FROM imovel_imagens WHERE imovel_id = :id ORDER BY ordem ASC');
        $imgStmt->execute([':id' => $id]);
        $imovel['imagens'] = $imgStmt->fetchAll();

        responderJson(['sucesso' => true, 'imovel' => $imovel]);
    }

    // ---- Pesquisa / listagem com filtros ----
    $condicoes = ["status = 'disponivel'"];
    $parametros = [];

    if (!empty($_GET['bairro'])) {
        $condicoes[] = '(bairro LIKE :bairro OR cidade LIKE :bairro)';
        $parametros[':bairro'] = '%' . $_GET['bairro'] . '%';
    }

    if (!empty($_GET['tipo']) && $_GET['tipo'] !== 'todos') {
        $condicoes[] = 'tipo = :tipo';
        $parametros[':tipo'] = $_GET['tipo'];
    }

    if (!empty($_GET['preco_max']) && is_numeric($_GET['preco_max'])) {
        $condicoes[] = 'preco_mensal <= :preco_max';
        $parametros[':preco_max'] = (float) $_GET['preco_max'];
    }

    if (!empty($_GET['quartos']) && is_numeric($_GET['quartos'])) {
        $condicoes[] = 'quartos >= :quartos';
        $parametros[':quartos'] = (int) $_GET['quartos'];
    }

    $sql = 'SELECT id, titulo, tipo, bairro, cidade, preco_mensal, quartos, casas_banho,
                   area_m2, descricao, comodidades, status, destaque, imagem_capa
            FROM imoveis
            WHERE ' . implode(' AND ', $condicoes) . '
            ORDER BY destaque DESC, criado_em DESC';

    $stmt = $pdo->prepare($sql);
    $stmt->execute($parametros);
    $imoveis = $stmt->fetchAll();

    responderJson(['sucesso' => true, 'total' => count($imoveis), 'imoveis' => $imoveis]);

} catch (PDOException $e) {
    responderJson([
        'sucesso' => false,
        'erro'    => 'Não foi possível ligar à base de dados. Verifique a configuração em php/config.php.',
    ], 500);
}
