<?php
// Disable display errors to prevent HTML output
error_reporting(E_ALL);
ini_set('display_errors', 0);
ini_set('log_errors', 1);
ini_set('error_log', __DIR__ . '/error.log');

try {
    // Load .env
    $envFile = __DIR__ . '/.env';
    
    if (!file_exists($envFile)) {
        error_log('.env file not found at: ' . $envFile);
        throw new Exception('.env file not found');
    }
    
    $env = parse_ini_file($envFile);
    
    if ($env === false) {
        error_log('Failed to parse .env file');
        throw new Exception('Failed to parse .env file');
    }

    // Validate required env variables
    $required = ['DB_HOST', 'DB_NAME', 'DB_USER', 'DB_PASSWORD', 'JWT_SECRET'];
    foreach ($required as $key) {
        if (!isset($env[$key])) {
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

    // JWT Secret
    if (!defined('JWT_SECRET')) {
        define('JWT_SECRET', $env['JWT_SECRET']);
    }

    // Roles
    if (!defined('ROLE_ADMIN')) define('ROLE_ADMIN', 'admin');
    if (!defined('ROLE_SECURITY')) define('ROLE_SECURITY', 'security');
    if (!defined('ROLE_ICT')) define('ROLE_ICT', 'ict');
    if (!defined('ROLE_MANAGER')) define('ROLE_MANAGER', 'manager');
    if (!defined('ROLE_AUDITOR')) define('ROLE_AUDITOR', 'auditor');
    if (!defined('ROLE_STAFF')) define('ROLE_STAFF', 'staff');

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