<?php
/**
 * INTAKA VILLAGE — Configuração e ligação à base de dados
 * ---------------------------------------------------------
 * Altere as credenciais abaixo consoante o seu ambiente
 * (XAMPP/MAMP local, ou o servidor de produção).
 */

declare(strict_types=1);

// ----- Credenciais da base de dados -----
define('DB_HOST', 'localhost');
define('DB_NAME', 'intaka_village');
define('DB_USER', 'root');
define('DB_PASS', '');
define('DB_CHARSET', 'utf8mb4');

// ----- Outras configurações gerais -----
define('WHATSAPP_NUMERO', '258840000000'); // formato internacional, sem "+"
define('CONTACTO_EMAIL', 'visitas@intakavillage.co.mz');

// Mostra erros apenas em desenvolvimento. Definir para 0 em produção.
ini_set('display_errors', '0');
error_reporting(E_ALL);

/**
 * Devolve uma ligação PDO reutilizável à base de dados.
 * Lança PDOException em caso de falha, apanhada pelos endpoints da API.
 */
function obterLigacaoBD(): PDO
{
    static $pdo = null;

    if ($pdo instanceof PDO) {
        return $pdo;
    }

    $dsn = 'mysql:host=' . DB_HOST . ';dbname=' . DB_NAME . ';charset=' . DB_CHARSET;

    $pdo = new PDO($dsn, DB_USER, DB_PASS, [
        PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        PDO::ATTR_EMULATE_PREPARES   => false,
    ]);

    return $pdo;
}

/**
 * Envia uma resposta JSON padronizada e termina a execução.
 */
function responderJson(array $dados, int $codigoHttp = 200): void
{
    http_response_code($codigoHttp);
    header('Content-Type: application/json; charset=utf-8');
    echo json_encode($dados, JSON_UNESCAPED_UNICODE);
    exit;
}
