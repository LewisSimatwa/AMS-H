<?php
error_reporting(E_ALL);
ini_set('display_errors', 0);
ini_set('log_errors', 1);
ini_set('error_log', __DIR__ . '/error.log');

try {
    // Load env variables - from environment (Render) or fallback to .env file (local dev)
    $env = [];

    $envFile = __DIR__ . '/.env';
    if (file_exists($envFile)) {
        $env = parse_ini_file($envFile) ?: [];
    }

    // Environment variables (Render) override .env values
    $keys = ['DB_HOST', 'DB_NAME', 'DB_USER', 'DB_PASSWORD', 'JWT_SECRET'];
    foreach ($keys as $key) {
        $val = getenv($key);
        if ($val !== false) {
            $env[$key] = $val;
        }
    }

    // Validate required env variables
    $required = ['DB_HOST', 'DB_NAME', 'DB_USER', 'DB_PASSWORD', 'JWT_SECRET'];
    foreach ($required as $key) {
        if (empty($env[$key])) {
            error_log("Missing required env variable: $key");
            throw new Exception("Missing required configuration: $key");
        }
    }

    // Database connection
    $dsn = "pgsql:host={$env['DB_HOST']};dbname={$env['DB_NAME']}";
    $db = new PDO($dsn, $env['DB_USER'], $env['DB_PASSWORD'], [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        PDO::ATTR_EMULATE_PREPARES => false
    ]);

    error_log('Database connected successfully');

    if (!defined('JWT_SECRET')) define('JWT_SECRET', $env['JWT_SECRET']);

    if (!defined('ROLE_ADMIN'))    define('ROLE_ADMIN',    'admin');
    if (!defined('ROLE_SECURITY')) define('ROLE_SECURITY', 'security');
    if (!defined('ROLE_ICT'))      define('ROLE_ICT',      'ict');
    if (!defined('ROLE_MANAGER'))  define('ROLE_MANAGER',  'manager');
    if (!defined('ROLE_AUDITOR'))  define('ROLE_AUDITOR',  'auditor');
    if (!defined('ROLE_STAFF'))    define('ROLE_STAFF',    'staff');

} catch (PDOException $e) {
    error_log('Database connection error: ' . $e->getMessage());
    http_response_code(500);
    echo json_encode(['error' => 'Database connection failed: ' . $e->getMessage()]);
    exit;
} catch (Exception $e) {
    error_log('Configuration error: ' . $e->getMessage());
    http_response_code(500);
    echo json_encode(['error' => 'Configuration error: ' . $e->getMessage()]);
    exit;
}
?>