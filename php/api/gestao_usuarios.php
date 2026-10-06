<?php
/**
 * INTAKA VILLAGE — API de gestão de utilizadores
 * Usada exclusivamente pelo painel admin.html (RF9 — o administrador
 * deve poder gerir utilizadores e anúncios da plataforma).
 *
 * GET    /php/api/gestao_usuarios.php          — lista todos os utilizadores
 * PATCH  /php/api/gestao_usuarios.php?id=X     — ativa/desativa ou muda o tipo de conta
 * DELETE /php/api/gestao_usuarios.php?id=X     — remove um utilizador
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
            $stmt = $pdo->query('SELECT id, nome, email, telefone, tipo, ativo, criado_em FROM usuarios ORDER BY criado_em DESC');
            responderJson(['sucesso' => true, 'usuarios' => $stmt->fetchAll()]);
            break;

        case 'PATCH':
            if ($id <= 0) responderJson(['sucesso' => false, 'erro' => 'Indique o id do utilizador.'], 400);

            $dados = json_decode(file_get_contents('php://input'), true) ?? [];
            $campos = [];
            $params = [':id' => $id];

            if (isset($dados['ativo'])) {
                $campos[] = 'ativo = :ativo';
                $params[':ativo'] = !empty($dados['ativo']) ? 1 : 0;
            }
            if (isset($dados['tipo'])) {
                $tiposValidos = ['inquilino', 'proprietario', 'administrador'];
                if (!in_array($dados['tipo'], $tiposValidos, true)) {
                    responderJson(['sucesso' => false, 'erro' => 'Tipo de conta inválido.'], 422);
                }
                $campos[] = 'tipo = :tipo';
                $params[':tipo'] = $dados['tipo'];
            }

            if (!$campos) responderJson(['sucesso' => false, 'erro' => 'Nada para atualizar.'], 400);

            $stmt = $pdo->prepare('UPDATE usuarios SET ' . implode(', ', $campos) . ' WHERE id = :id');
            $stmt->execute($params);

            responderJson(['sucesso' => true, 'mensagem' => 'Utilizador atualizado.']);
            break;

        case 'DELETE':
            if ($id <= 0) responderJson(['sucesso' => false, 'erro' => 'Indique o id do utilizador a remover.'], 400);

            $stmt = $pdo->prepare('DELETE FROM usuarios WHERE id = :id');
            $stmt->execute([':id' => $id]);

            responderJson(['sucesso' => true, 'mensagem' => 'Utilizador removido.']);
            break;

        default:
            responderJson(['sucesso' => false, 'erro' => 'Método não permitido.'], 405);
    }

} catch (PDOException $e) {
    responderJson(['sucesso' => false, 'erro' => 'Não foi possível ligar à base de dados.'], 500);
}
