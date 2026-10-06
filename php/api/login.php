<?php
/**
 * INTAKA VILLAGE — API de autenticação
 * POST /php/api/login.php
 * Corpo (JSON): { email, senha, tipo }
 *   tipo: "inquilino" | "proprietario" | "administrador"
 *
 * Valida as credenciais na tabela `usuarios` e confirma que o perfil
 * selecionado corresponde ao tipo de conta. Não gere sessões/cookies —
 * esta é uma camada de autenticação leve, pronta para evoluir para um
 * sistema completo (RF1/RF9 do levantamento de requisitos) quando a
 * aplicação ganhar áreas reservadas por perfil.
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

$dados = json_decode(file_get_contents('php://input'), true) ?? $_POST;

$email = trim((string)($dados['email'] ?? ''));
$senha = (string)($dados['senha'] ?? '');
$tipo  = trim((string)($dados['tipo'] ?? ''));

$tiposValidos = ['inquilino', 'proprietario', 'administrador'];

$erros = [];
if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
    $erros[] = 'Indique um e-mail válido.';
}
if ($senha === '') {
    $erros[] = 'Indique a sua palavra-passe.';
}
if (!in_array($tipo, $tiposValidos, true)) {
    $erros[] = 'Selecione o tipo de conta (Inquilino, Proprietário ou Administrador).';
}

if ($erros) {
    responderJson(['sucesso' => false, 'erros' => $erros], 422);
}

try {
    $pdo = obterLigacaoBD();

    $stmt = $pdo->prepare('SELECT id, nome, email, senha_hash, tipo, ativo FROM usuarios WHERE email = :email LIMIT 1');
    $stmt->execute([':email' => $email]);
    $usuario = $stmt->fetch();

    // E-mail não encontrado
    if (!$usuario) {
        responderJson(['sucesso' => false, 'erro' => 'E-mail incorreto.'], 401);
    }

    // Palavra-passe incorreta (aceita tanto hash bcrypt como texto simples —
    // ver verificarSenha() abaixo)
    if (!verificarSenha($senha, $usuario['senha_hash'])) {
        responderJson(['sucesso' => false, 'erro' => 'Senha incorreta.'], 401);
    }

    if ((int)$usuario['ativo'] !== 1) {
        responderJson(['sucesso' => false, 'erro' => 'Esta conta está inativa. Contacte a gestão de Intaka Village.'], 403);
    }

    // Credenciais corretas, mas perfil selecionado não corresponde à conta
    if ($usuario['tipo'] !== $tipo) {
        responderJson(['sucesso' => false, 'erro' => 'Esta conta não está registada como ' . rotuloPerfil($tipo) . '.'], 401);
    }

    responderJson([
        'sucesso'  => true,
        'mensagem' => 'Sessão iniciada com sucesso.',
        'usuario'  => [
            'id'    => (int) $usuario['id'],
            'nome'  => $usuario['nome'],
            'email' => $usuario['email'],
            'tipo'  => $usuario['tipo'],
        ],
    ]);

} catch (PDOException $e) {
    responderJson([
        'sucesso' => false,
        'erro'    => 'Não foi possível ligar à base de dados. Verifique a configuração em php/config.php.',
    ], 500);
}

/**
 * Verifica a palavra-passe digitada contra o valor guardado em
 * `senha_hash`, aceitando dois formatos:
 *
 *  - Hash bcrypt (gerado por password_hash()) — formato recomendado,
 *    usado pelas contas de demonstração semeadas em sql/schema.sql.
 *  - Texto simples — permite que, ao criar uma conta manualmente pelo
 *    phpMyAdmin (sem passar por password_hash()), o utilizador inicie
 *    sessão com a MESMA palavra-passe que foi escrita na coluna
 *    senha_hash, sem precisar gerar um hash à parte.
 *
 * NOTA DE SEGURANÇA: guardar palavras-passe em texto simples não é
 * recomendado para um sistema em produção com dados reais — qualquer
 * pessoa com acesso à base de dados consegue ler as senhas diretamente.
 * Esta função existe para facilitar testes/demonstração enquanto não
 * houver um formulário de registo que aplique password_hash()
 * automaticamente. Em produção, prefira sempre o formato bcrypt.
 */
function verificarSenha(string $senhaDigitada, string $senhaGuardada): bool
{
    $infoHash = password_get_info($senhaGuardada);

    if ($infoHash['algo'] !== null) {
        // senha_hash contém um hash bcrypt/argon2 válido
        return password_verify($senhaDigitada, $senhaGuardada);
    }

    // senha_hash contém texto simples — compara diretamente (timing-safe)
    return hash_equals($senhaGuardada, $senhaDigitada);
}

/**
 * Traduz o valor interno do tipo de conta para o rótulo apresentado
 * ao utilizador nas mensagens de erro.
 */
function rotuloPerfil(string $tipo): string
{
    $rotulos = [
        'inquilino'     => 'Inquilino',
        'proprietario'  => 'Proprietário',
        'administrador' => 'Administrador',
    ];
    return $rotulos[$tipo] ?? $tipo;
}
