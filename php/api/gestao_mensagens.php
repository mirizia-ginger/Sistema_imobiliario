<?php
/**
 * INTAKA VILLAGE — API de gestão de mensagens
 * Usada pelo painel proprietario.html (RF7/RF8 — comunicação e registo
 * das interações entre inquilino e proprietário).
 *
 * GET    /php/api/gestao_mensagens.php          — lista todas as mensagens (com dados do imóvel)
 * PATCH  /php/api/gestao_mensagens.php?id=X     — marca como lida/não lida
 * DELETE /php/api/gestao_mensagens.php?id=X     — remove uma mensagem
 */

declare(strict_types=1);

header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, PATCH, DELETE, OPTIONS');
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

        case 'GET':
            $sql = 'SELECT m.*, i.titulo AS imovel_titulo
                    FROM mensagens m
                    LEFT JOIN imoveis i ON i.id = m.imovel_id
                    ORDER BY m.criado_em DESC';
            $stmt = $pdo->query($sql);
            responderJson(['sucesso' => true, 'mensagens' => $stmt->fetchAll()]);
            break;

        case 'PATCH':
            if ($id <= 0) responderJson(['sucesso' => false, 'erro' => 'Indique o id da mensagem.'], 400);

            $dados = json_decode(file_get_contents('php://input'), true) ?? [];
            $status = trim((string)($dados['status'] ?? 'lida'));
            if (!in_array($status, ['lida', 'nao_lida'], true)) {
                responderJson(['sucesso' => false, 'erro' => 'Estado inválido.'], 422);
            }

            $stmt = $pdo->prepare('UPDATE mensagens SET status = :status WHERE id = :id');
            $stmt->execute([':status' => $status, ':id' => $id]);

            responderJson(['sucesso' => true, 'mensagem' => 'Mensagem atualizada.']);
            break;

        case 'DELETE':
            if ($id <= 0) responderJson(['sucesso' => false, 'erro' => 'Indique o id da mensagem a remover.'], 400);

            $stmt = $pdo->prepare('DELETE FROM mensagens WHERE id = :id');
            $stmt->execute([':id' => $id]);

            responderJson(['sucesso' => true, 'mensagem' => 'Mensagem removida.']);
            break;

        default:
            responderJson(['sucesso' => false, 'erro' => 'Método não permitido.'], 405);
    }

} catch (PDOException $e) {
    responderJson(['sucesso' => false, 'erro' => 'Não foi possível ligar à base de dados.'], 500);
}
