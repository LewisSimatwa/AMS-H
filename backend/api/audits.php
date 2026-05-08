<?php

function handleAudit($db, $method, $path) {
    header('Content-Type: application/json');

    // Safely get institution_id
    $institutionId = $_GET['institution_id'] ?? null;

    if (!$institutionId) {
        http_response_code(400);
        echo json_encode(['error' => 'institution_id is required']);
        exit;
    }

    // GET /audit/logs
    if ($method === 'GET' && $path === '/audit/logs') {
        try {
            $sql = "
                SELECT 
                    al.id,
                    al.action,
                    al.entity_type,
                    al.details,
                    al.created_at,
                    COALESCE(u.email, 'System') AS username
                FROM audit_logs al
                LEFT JOIN users u ON al.user_id = u.id
                WHERE al.institution_id = ?
                ORDER BY al.created_at DESC
                LIMIT 100
            ";

            $stmt = $db->prepare($sql);
            $stmt->execute([$institutionId]);

            echo json_encode(['logs' => $stmt->fetchAll(PDO::FETCH_ASSOC)]);
            exit;

        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode([
                'error' => 'Failed to fetch audit logs',
                'message' => $e->getMessage()
            ]);
            exit;
        }
    }

    // fallback for unmatched routes
    http_response_code(404);
    echo json_encode(['error' => 'Audit route not found']);
    exit;
}
