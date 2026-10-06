<?php
/**
 * INTAKA VILLAGE — API de gestão de visitas agendadas
 * Usada pelos painéis proprietario.html e admin.html.
 *
 * GET    /php/api/gestao_visitas.php              — lista todas as visitas (com dados do imóvel)
 * PATCH  /php/api/gestao_visitas.php?id=X          — atualiza o estado da visita
 * DELETE /php/api/gestao_visitas.php?id=X          — remove/cancela definitivamente uma visita
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
            $sql = 'SELECT v.*, i.titulo AS imovel_titulo, i.bairro AS imovel_bairro, i.imagem_capa AS imovel_imagem
                    FROM visitas v
                    INNER JOIN imoveis i ON i.id = v.imovel_id
                    ORDER BY v.data_preferida ASC, v.hora_preferida ASC';
            $stmt = $pdo->query($sql);
            responderJson(['sucesso' => true, 'visitas' => $stmt->fetchAll()]);
            break;

        case 'PATCH':
            if ($id <= 0) responderJson(['sucesso' => false, 'erro' => 'Indique o id da visita.'], 400);

            $dados = json_decode(file_get_contents('php://input'), true) ?? [];
            $status = trim((string)($dados['status'] ?? ''));
            $estadosValidos = ['pendente', 'confirmada', 'concluida', 'cancelada'];

            if (!in_array($status, $estadosValidos, true)) {
                responderJson(['sucesso' => false, 'erro' => 'Estado inválido.'], 422);
            }

            $stmt = $pdo->prepare('UPDATE visitas SET status = :status WHERE id = :id');
            $stmt->execute([':status' => $status, ':id' => $id]);

            responderJson(['sucesso' => true, 'mensagem' => 'Estado da visita atualizado.']);
            break;

        case 'DELETE':
            if ($id <= 0) responderJson(['sucesso' => false, 'erro' => 'Indique o id da visita a remover.'], 400);

            $stmt = $pdo->prepare('DELETE FROM visitas WHERE id = :id');
            $stmt->execute([':id' => $id]);

            responderJson(['sucesso' => true, 'mensagem' => 'Visita removida com sucesso.']);
            break;

        default:
            responderJson(['sucesso' => false, 'erro' => 'Método não permitido.'], 405);
    }

} catch (PDOException $e) {
    responderJson(['sucesso' => false, 'erro' => 'Não foi possível ligar à base de dados.'], 500);
}
