<?php
// CORS - must be before everything else
$allowedOrigins = [
    'https://ams-h.vercel.app',
    'http://localhost:5173',
    'http://localhost:3000',
];

$origin = $_SERVER['HTTP_ORIGIN'] ?? '';
if (in_array($origin, $allowedOrigins)) {
    header("Access-Control-Allow-Origin: $origin");
    header('Access-Control-Allow-Credentials: true');
} 

header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization, X-Institution-ID');
header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

require 'config.php';
require 'helpers.php';

$method = $_SERVER['REQUEST_METHOD'];
$path = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);

// Remove /api prefix if present
$path = str_replace('/api', '', $path);

// Log for debugging
error_log("Request path: $path, Method: $method");

try {
    // ============================================
    // PUBLIC ROUTES (NO TOKEN REQUIRED)
    // ============================================
    if ($path === '/login' && $method === 'POST') {
        require 'auth.php';
        login();
    } elseif ($path === '/register' && $method === 'POST') {
        require 'register.php';
        register();
    } elseif ($path === '/register.php' && $method === 'POST') {
        require 'register.php';
        register();
    } elseif ($path === '/auth.php' && $method === 'POST') {
        require 'auth.php';
        $input = getInput();
        $action = $input['action'] ?? 'login';
        if ($action === 'login') {
            login();
        } elseif ($action === 'logout') {
            logout();
        }
    } elseif ($path === '/logout' && $method === 'POST') {
        require 'auth.php';
        logout();
    } elseif ($path === '/public-institutions' && $method === 'GET') {
        require __DIR__ . '/public-institutions.php';
    }
        elseif ($path === '/barcode' && $method === 'GET') {
        require __DIR__ . '/barcode.php';
    } elseif ($path === '/barcode.php' && $method === 'GET') {
        require __DIR__ . '/barcode.php';
    }

    // ============================================
    // PROTECTED ROUTES (TOKEN REQUIRED)
    // ============================================
    else {
        // Verify authentication and get current user
        $currentUser = verifyAuth();


        // ----------------------------------------
        // ASSET MANAGEMENT ROUTES
        // ----------------------------------------
        if ($path === '/available' && $method === 'GET') {
            require __DIR__ . '/available.php';
        } elseif (strpos($path, '/assets') === 0) {
            require 'assets.php';
            handleAssets($db, $method, $path);
        } 

        // ----------------------------------------
        // TRANSACTION ROUTES
        // ----------------------------------------
        elseif (strpos($path, '/transactions') === 0) {
            require 'transactions.php';
            handleTransactions($db, $method, $path);
        }

        // ----------------------------------------
        // MAINTENANCE ROUTES
        // ----------------------------------------
        elseif (strpos($path, '/maintenance') === 0) {
            require 'maintenance.php';
            handleMaintenance($db, $method, $path);
        }

        // ----------------------------------------
        // ANALYTICS ROUTES
        // ----------------------------------------
        elseif (strpos($path, '/analytics') === 0) {
            require 'analytics.php';
            handleAnalytics($db, $method, $path, $currentUser); // CHANGED: Added $currentUser parameter
        }

        // ----------------------------------------
        // REPORTS ROUTES
        // ----------------------------------------
        elseif (strpos($path, '/reports') === 0) {
            require 'report.php';
            handleReports($db, $method, $path);
        }

        // ----------------------------------------
        // AUDIT LOGS ROUTES
        // ----------------------------------------
        elseif (strpos($path, '/audit') === 0) {
            require 'audit_logs.php';
            handleAudit($db, $method, $path);
        }

        // ----------------------------------------
        // DEPARTMENT MANAGEMENT ROUTES (ADMIN ONLY)
        // ----------------------------------------
        elseif ($path === '/departments.php' && in_array($method, ['GET', 'POST'])) {
            require 'departments.php';
        } elseif (strpos($path, '/departments') === 0) {
            require 'departments.php';
        }

        // ----------------------------------------
        // USER MANAGEMENT ROUTES (ADMIN ONLY)
        // ----------------------------------------
        elseif ($path === '/users.php' && in_array($method, ['GET','POST'])) {
            require 'users.php';
            // users.php handles its own routing based on $_GET['action']
        } elseif ($path === '/users' && $method === 'GET') {
            $_GET['action'] = 'list';
            require 'users.php';
        } elseif ($path === '/users' && $method === 'POST') {
            $input = json_decode(file_get_contents('php://input'), true);
            $_GET['action'] = $input['action'] ?? 'create';
            require 'users.php';
        } elseif (preg_match('#^/users/(\d+)$#', $path, $matches)) {
            $_GET['id'] = $matches[1];
            if ($method === 'GET') $_GET['action'] = 'get';
            elseif ($method === 'PUT') $_GET['action'] = 'update';
            elseif ($method === 'DELETE') $_GET['action'] = 'delete';
            require 'users.php';
        } elseif ($path === '/users/roles' && $method === 'GET') {
            $_GET['action'] = 'get_roles';
            require 'users.php';
        } elseif ($path === '/users/departments' && $method === 'GET') {
            $_GET['action'] = 'get_departments';
            require 'users.php';
        } elseif (preg_match('#^/users/(\d+)/toggle-status$#', $path, $matches) && $method === 'POST') {
            $_GET['action'] = 'toggle_status';
            $_GET['id'] = $matches[1];
            require 'users.php';
        } elseif (strpos($path, '/users') === 0) {
            require 'users.php';
        }

        // ----------------------------------------
        // SUPER ADMIN ROUTES
        // ----------------------------------------
        elseif (strpos($path, '/super_admin') === 0) {
            // Verify super admin role
            if (!isset($currentUser['role']) || $currentUser['role'] !== 'super_admin') {
                respond(['error' => 'Access denied. Super admin privileges required.'], 403);
            }

            // Route to appropriate super admin handler
            if ($path === '/super_admin/stats' && $method === 'GET') {
                require __DIR__ . '/super_admin/stats.php';   
            } 
            elseif ($path === '/super_admin/recent-actions' && $method === 'GET') {
                require __DIR__ . '/super_admin/recent-actions.php';
            } 
            
            // ANALYTICS ROUTES - ADD THESE FIRST
            elseif ($path === '/super_admin/analytics' && $method === 'GET') {
                require __DIR__ . '/super_admin/analytics.php';
            }
            elseif ($path === '/super_admin/analytics-export' && $method === 'GET') {
                require __DIR__ . '/super_admin/analytics-export.php';
            } 
            elseif ($path === '/super_admin/analytics-export.php' && $method === 'GET') {
                require __DIR__ . '/super_admin/analytics-export.php';
            }
            
            // AUDIT LOGS ROUTES
            elseif ($path === '/super_admin/audit-logs' && $method === 'GET') {
                require __DIR__ . '/super_admin/audit-logs.php';
            }
            elseif ($path === '/super_admin/audit-logs-export' && $method === 'GET') {
                require __DIR__ . '/super_admin/audit-logs-export.php';
            } 
            elseif ($path === '/super_admin/audit-logs-export.php' && $method === 'GET') {
                require __DIR__ . '/super_admin/audit-logs-export.php';
            }
            
            // ADMINS ROUTE
            elseif ($path === '/super_admin/admins' && $method === 'GET') {
                require __DIR__ . '/super_admin/admins.php';
            }
            
            // INSTITUTIONS ROUTES
            elseif ($path === '/super_admin/institutions' && in_array($method, ['GET', 'POST', 'PUT', 'DELETE'])) {
                require __DIR__ . '/super_admin/institutions.php';
            } 
            elseif ($path === '/super_admin/deactivate-institution' && $method === 'PUT') {
                require __DIR__ . '/super_admin/institutions/deactivate.php';
            } 
            
            // ADMIN MANAGEMENT ROUTES
            elseif ($path === '/super_admin/institution-admins' && $method === 'GET') {
                require __DIR__ . '/super_admin/institution-admins.php';
            } 
            elseif ($path === '/super_admin/create-admin' && $method === 'POST') {
                require __DIR__ . '/super_admin/create-admin.php';
            } 
            elseif ($path === '/super_admin/revoke-admin' && $method === 'DELETE') {
                require __DIR__ . '/super_admin/revoke-admin.php';
            } 
            elseif ($path === '/super_admin/reset-admin-password' && $method === 'POST') {
                require __DIR__ . '/super_admin/reset-admin-password.php';
            } 
            
            // CSV ROUTES
            elseif ($path === '/super_admin/csv/import' && $method === 'POST') {
                require __DIR__ . '/super_admin/csv/import.php';
            }
            elseif ($path === '/super_admin/csv/import.php' && $method === 'POST') {
                require __DIR__ . '/super_admin/csv/import.php';
            } 
            elseif ($path === '/super_admin/csv/validate' && $method === 'POST') {
                require __DIR__ . '/super_admin/csv/validate.php';
            }
            elseif ($path === '/super_admin/csv/validate.php' && $method === 'POST') {
                require __DIR__ . '/super_admin/csv/validate.php';
            }
            
            // ASSET MANAGEMENT ROUTES
            // elseif ($path === '/super_admin/assets' && $method === 'GET') {
            //     require __DIR__ . '/super_admin/assets.php';
            // } 
            // elseif ($path === '/super_admin/force-retire' && $method === 'POST') {
            //     require __DIR__ . '/super_admin/force-retire.php';
            // } 
            // elseif ($path === '/super_admin/asset-history' && $method === 'GET') {
            //     require __DIR__ . '/super_admin/asset-history.php';
            // } 
            
            // SYSTEM CONFIG
            elseif ($path === '/super_admin/system-config' && in_array($method, ['GET', 'POST'])) {
                require __DIR__ . '/super_admin/system-config.php';
            }
            
            // USERS
            elseif ($path === '/super_admin/users' && $method === 'GET') {
                require __DIR__ . '/super_admin/users.php';
            }
            
            else {
                error_log("Super admin route not found: $path");
                respond(['error' => 'Super admin route not found: ' . $path], 404);
            }
        }

        // ----------------------------------------
        // 404 - ROUTE NOT FOUND
        // ----------------------------------------
        else {
            error_log("Route not found: $path");
            respond(['error' => 'Route not found: ' . $path], 404);
        }
    }

} catch (Exception $e) {
    error_log('API Error: ' . $e->getMessage());
    error_log('Stack trace: ' . $e->getTraceAsString());
    respond([
        'error' => $e->getMessage(),
        'success' => false
    ], 500);
}
?>