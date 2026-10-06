<?php
/**
 * INTAKA VILLAGE — API de agendamento de visitas
 * POST /php/api/agendar_visita.php
 * Corpo (JSON): { imovel_id, nome, telefone, email, data_preferida, hora_preferida, mensagem }
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

$corpo  = file_get_contents('php://input');
$dados  = json_decode($corpo, true) ?? $_POST;

$nome           = trim((string)($dados['nome'] ?? ''));
$telefone       = trim((string)($dados['telefone'] ?? ''));
$email          = trim((string)($dados['email'] ?? ''));
$imovelId       = (int)($dados['imovel_id'] ?? 0);
$dataPreferida  = trim((string)($dados['data_preferida'] ?? ''));
$horaPreferida  = trim((string)($dados['hora_preferida'] ?? ''));
$mensagem       = trim((string)($dados['mensagem'] ?? ''));

// ---- Validação (RNF1: interface simples, mas dados sempre validados no servidor) ----
$erros = [];

if ($nome === '' || mb_strlen($nome) < 2) {
    $erros[] = 'Indique o seu nome completo.';
}
if (!preg_match('/^[0-9+()\s-]{7,20}$/', $telefone)) {
    $erros[] = 'Indique um número de telefone válido.';
}
if ($email !== '' && !filter_var($email, FILTER_VALIDATE_EMAIL)) {
    $erros[] = 'Indique um e-mail válido ou deixe o campo em branco.';
}
if ($imovelId <= 0) {
    $erros[] = 'Selecione o imóvel que pretende visitar.';
}
$dataObj = DateTime::createFromFormat('Y-m-d', $dataPreferida);
if (!$dataObj || $dataObj < new DateTime('today')) {
    $erros[] = 'Escolha uma data válida (a partir de hoje).';
}
if (!preg_match('/^([01]\d|2[0-3]):[0-5]\d$/', $horaPreferida)) {
    $erros[] = 'Escolha uma hora válida.';
}

if ($erros) {
    responderJson(['sucesso' => false, 'erros' => $erros], 422);
}

try {
    $pdo = obterLigacaoBD();

    // Confirma que o imóvel existe e está disponível
    $verifica = $pdo->prepare('SELECT id, titulo FROM imoveis WHERE id = :id AND status = "disponivel"');
    $verifica->execute([':id' => $imovelId]);
    $imovel = $verifica->fetch();

    if (!$imovel) {
        responderJson(['sucesso' => false, 'erro' => 'Este imóvel já não está disponível.'], 404);
    }

    $stmt = $pdo->prepare(
        'INSERT INTO visitas (imovel_id, nome, telefone, email, data_preferida, hora_preferida, mensagem)
         VALUES (:imovel_id, :nome, :telefone, :email, :data_preferida, :hora_preferida, :mensagem)'
    );

    $stmt->execute([
        ':imovel_id'      => $imovelId,
        ':nome'           => $nome,
        ':telefone'       => $telefone,
        ':email'          => $email !== '' ? $email : null,
        ':data_preferida' => $dataObj->format('Y-m-d'),
        ':hora_preferida' => $horaPreferida,
        ':mensagem'       => $mensagem !== '' ? $mensagem : null,
    ]);

    responderJson([
        'sucesso'   => true,
        'id'        => (int) $pdo->lastInsertId(),
        'mensagem'  => 'Pedido de visita recebido! A nossa equipa vai confirmar consigo em breve.',
        'imovel'    => $imovel['titulo'],
        'whatsapp'  => WHATSAPP_NUMERO,
    ]);

} catch (PDOException $e) {
    responderJson([
        'sucesso' => false,
        'erro'    => 'Não foi possível registar o pedido. Tente novamente ou contacte-nos via WhatsApp.',
    ], 500);
}
