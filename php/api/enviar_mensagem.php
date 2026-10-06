<?php
/**
 * INTAKA VILLAGE — API de mensagens de contacto
 * POST /php/api/enviar_mensagem.php
 * Corpo (JSON): { imovel_id, nome, contacto, mensagem }
 *
 * Usada a partir da página de detalhes de um imóvel (RF7 — comunicação
 * entre o interessado e a gestão de Intaka Village).
 */

declare(strict_types=1);

header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

require_once __DIR__ . '/../config.php';

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    responderJson(['sucesso' => false, 'erro' => 'Método não permitido.'], 405);
}

$corpo = file_get_contents('php://input');
$dados = json_decode($corpo, true) ?? $_POST;

$imovelId  = (int)($dados['imovel_id'] ?? 0);
$nome      = trim((string)($dados['nome'] ?? ''));
$contacto  = trim((string)($dados['contacto'] ?? ''));
$mensagem  = trim((string)($dados['mensagem'] ?? ''));

// ---- Validação ----
$erros = [];

if ($nome === '' || mb_strlen($nome) < 2) {
    $erros[] = 'Indique o seu nome.';
}
if ($contacto === '' || mb_strlen($contacto) < 6) {
    $erros[] = 'Indique um telefone ou e-mail válido para o contactarmos.';
}
if ($mensagem === '' || mb_strlen($mensagem) < 5) {
    $erros[] = 'Escreva a sua mensagem.';
}

if ($erros) {
    responderJson(['sucesso' => false, 'erros' => $erros], 422);
}

try {
    $pdo = obterLigacaoBD();

    // Se um imóvel foi indicado, confirma que existe (mas permite mensagens gerais com imovel_id nulo)
    $imovelIdParaGuardar = null;
    if ($imovelId > 0) {
        $verifica = $pdo->prepare('SELECT id FROM imoveis WHERE id = :id');
        $verifica->execute([':id' => $imovelId]);
        if ($verifica->fetch()) {
            $imovelIdParaGuardar = $imovelId;
        }
    }

    $stmt = $pdo->prepare(
        'INSERT INTO mensagens (imovel_id, remetente_nome, remetente_contacto, conteudo)
         VALUES (:imovel_id, :nome, :contacto, :conteudo)'
    );

    $stmt->execute([
        ':imovel_id' => $imovelIdParaGuardar,
        ':nome'      => $nome,
        ':contacto'  => $contacto,
        ':conteudo'  => $mensagem,
    ]);

    responderJson([
        'sucesso'  => true,
        'id'       => (int) $pdo->lastInsertId(),
        'mensagem' => 'Mensagem enviada! A nossa equipa responde-lhe em breve.',
    ]);

} catch (PDOException $e) {
    responderJson([
        'sucesso' => false,
        'erro'    => 'Não foi possível enviar a mensagem. Tente novamente ou contacte-nos via WhatsApp.',
    ], 500);
}
