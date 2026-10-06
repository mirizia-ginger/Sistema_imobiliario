<?php
/**
 * INTAKA VILLAGE — API de gestão de imóveis
 * Usada pelos painéis proprietario.html e admin.html (RF2, RF3, RF9).
 *
 * GET    /php/api/gestao_imoveis.php              — lista todos os imóveis (qualquer estado)
 * GET    /php/api/gestao_imoveis.php?id=X          — detalhe de um imóvel
 * POST   /php/api/gestao_imoveis.php               — cria um novo anúncio
 * PUT    /php/api/gestao_imoveis.php?id=X          — edita um anúncio existente
 * PATCH  /php/api/gestao_imoveis.php?id=X          — atualiza apenas o estado (disponivel/reservado/arrendado)
 * DELETE /php/api/gestao_imoveis.php?id=X          — remove um anúncio
 *
 * NOTA IMPORTANTE: esta é uma landing page com autenticação leve (ver
 * php/api/login.php) e ainda sem sessões/cookies. Por isso este endpoint
 * não filtra por proprietário autenticado — devolve/gere todos os
 * imóveis, tal como os dados de demonstração (todos pertencem ao
 * "Intaka Village Gestão", id 1). Antes de produção, adicione sessões
 * (RNF9) e restrinja cada proprietário aos seus próprios imóveis.
 */

declare(strict_types=1);

header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, PATCH, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

require_once __DIR__ . '/../config.php';

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit;
}

$metodo = $_SERVER['REQUEST_METHOD'];
$id = isset($_GET['id']) ? (int) $_GET['id'] : 0;

try {
    $pdo = obterLigacaoBD();

    switch ($metodo) {

        // -----------------------------------------------------------
        case 'GET':
            if ($id > 0) {
                $stmt = $pdo->prepare('SELECT * FROM imoveis WHERE id = :id');
                $stmt->execute([':id' => $id]);
                $imovel = $stmt->fetch();
                if (!$imovel) responderJson(['sucesso' => false, 'erro' => 'Imóvel não encontrado.'], 404);
                responderJson(['sucesso' => true, 'imovel' => $imovel]);
            }

            $stmt = $pdo->query('SELECT * FROM imoveis ORDER BY criado_em DESC');
            responderJson(['sucesso' => true, 'imoveis' => $stmt->fetchAll()]);
            break;

        // -----------------------------------------------------------
        case 'POST':
            $dados = json_decode(file_get_contents('php://input'), true) ?? [];
            $erros = validarImovel($dados);
            if ($erros) responderJson(['sucesso' => false, 'erros' => $erros], 422);

            $stmt = $pdo->prepare(
                'INSERT INTO imoveis
                 (proprietario_id, titulo, tipo, bairro, cidade, endereco, preco_mensal, quartos, casas_banho, area_m2, descricao, comodidades, status, destaque, imagem_capa)
                 VALUES (:proprietario_id, :titulo, :tipo, :bairro, :cidade, :endereco, :preco_mensal, :quartos, :casas_banho, :area_m2, :descricao, :comodidades, :status, :destaque, :imagem_capa)'
            );
            $stmt->execute(parametrosImovel($dados));

            $novoId = (int) $pdo->lastInsertId();
            responderJson(['sucesso' => true, 'id' => $novoId, 'mensagem' => 'Anúncio criado com sucesso.']);
            break;

        // -----------------------------------------------------------
        case 'PUT':
            if ($id <= 0) responderJson(['sucesso' => false, 'erro' => 'Indique o id do imóvel a editar.'], 400);

            $dados = json_decode(file_get_contents('php://input'), true) ?? [];
            $erros = validarImovel($dados);
            if ($erros) responderJson(['sucesso' => false, 'erros' => $erros], 422);

            $params = parametrosImovel($dados);
            $params[':id'] = $id;

            $stmt = $pdo->prepare(
                'UPDATE imoveis SET
                    titulo = :titulo, tipo = :tipo, bairro = :bairro, cidade = :cidade,
                    endereco = :endereco, preco_mensal = :preco_mensal, quartos = :quartos,
                    casas_banho = :casas_banho, area_m2 = :area_m2, descricao = :descricao,
                    comodidades = :comodidades, status = :status, destaque = :destaque,
                    imagem_capa = :imagem_capa
                 WHERE id = :id'
            );
            unset($params[':proprietario_id']);
            $stmt->execute($params);

            responderJson(['sucesso' => true, 'mensagem' => 'Anúncio atualizado com sucesso.']);
            break;

        // -----------------------------------------------------------
        case 'PATCH':
            if ($id <= 0) responderJson(['sucesso' => false, 'erro' => 'Indique o id do imóvel.'], 400);

            $dados = json_decode(file_get_contents('php://input'), true) ?? [];
            $status = trim((string)($dados['status'] ?? ''));
            $estadosValidos = ['disponivel', 'reservado', 'arrendado'];

            if (!in_array($status, $estadosValidos, true)) {
                responderJson(['sucesso' => false, 'erro' => 'Estado inválido.'], 422);
            }

            $stmt = $pdo->prepare('UPDATE imoveis SET status = :status WHERE id = :id');
            $stmt->execute([':status' => $status, ':id' => $id]);

            responderJson(['sucesso' => true, 'mensagem' => 'Estado do imóvel atualizado.']);
            break;

        // -----------------------------------------------------------
        case 'DELETE':
            if ($id <= 0) responderJson(['sucesso' => false, 'erro' => 'Indique o id do imóvel a remover.'], 400);

            $stmt = $pdo->prepare('DELETE FROM imoveis WHERE id = :id');
            $stmt->execute([':id' => $id]);

            responderJson(['sucesso' => true, 'mensagem' => 'Anúncio removido com sucesso.']);
            break;

        // -----------------------------------------------------------
        default:
            responderJson(['sucesso' => false, 'erro' => 'Método não permitido.'], 405);
    }

} catch (PDOException $e) {
    responderJson(['sucesso' => false, 'erro' => 'Não foi possível ligar à base de dados.'], 500);
}

/**
 * Valida os campos obrigatórios de um imóvel. Devolve um array de erros
 * (vazio se tudo estiver válido).
 */
function validarImovel(array $dados): array
{
    $erros = [];
    $tiposValidos = ['Apartamento T1', 'Apartamento T2', 'Moradia T2', 'Moradia T3', 'Moradia T4'];
    $estadosValidos = ['disponivel', 'reservado', 'arrendado'];

    if (trim((string)($dados['titulo'] ?? '')) === '') $erros[] = 'O título é obrigatório.';
    if (!in_array($dados['tipo'] ?? '', $tiposValidos, true)) $erros[] = 'Selecione uma tipologia válida.';
    if (trim((string)($dados['bairro'] ?? '')) === '') $erros[] = 'O bairro é obrigatório.';
    if (!is_numeric($dados['preco_mensal'] ?? null) || (float)$dados['preco_mensal'] <= 0) $erros[] = 'Indique um preço mensal válido.';
    if (!is_numeric($dados['quartos'] ?? null) || (int)$dados['quartos'] < 0) $erros[] = 'Indique o número de quartos.';
    if (!is_numeric($dados['casas_banho'] ?? null) || (int)$dados['casas_banho'] < 0) $erros[] = 'Indique o número de casas de banho.';
    if (!is_numeric($dados['area_m2'] ?? null) || (float)$dados['area_m2'] <= 0) $erros[] = 'Indique a área em m².';
    if (trim((string)($dados['imagem_capa'] ?? '')) === '') $erros[] = 'Indique a imagem de capa.';
    if (isset($dados['status']) && !in_array($dados['status'], $estadosValidos, true)) $erros[] = 'Estado inválido.';

    return $erros;
}

/**
 * Monta o array de parâmetros PDO a partir dos dados recebidos.
 */
function parametrosImovel(array $dados): array
{
    return [
        ':proprietario_id' => !empty($dados['proprietario_id']) ? (int) $dados['proprietario_id'] : 1,
        ':titulo'          => trim((string) $dados['titulo']),
        ':tipo'            => $dados['tipo'],
        ':bairro'          => trim((string) $dados['bairro']),
        ':cidade'          => trim((string)($dados['cidade'] ?? 'Maputo')) ?: 'Maputo',
        ':endereco'        => trim((string)($dados['endereco'] ?? '')) ?: null,
        ':preco_mensal'    => (float) $dados['preco_mensal'],
        ':quartos'         => (int) $dados['quartos'],
        ':casas_banho'     => (int) $dados['casas_banho'],
        ':area_m2'         => (float) $dados['area_m2'],
        ':descricao'       => trim((string)($dados['descricao'] ?? '')) ?: null,
        ':comodidades'     => trim((string)($dados['comodidades'] ?? '')) ?: null,
        ':status'          => $dados['status'] ?? 'disponivel',
        ':destaque'        => !empty($dados['destaque']) ? 1 : 0,
        ':imagem_capa'     => trim((string) $dados['imagem_capa']),
    ];
}
