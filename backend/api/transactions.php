<?php
require __DIR__ . "/config.php";
header("Content-Type: application/json");
header("Access-Control-Allow-Origin: *");

$token = null;
if (isset($_SERVER['HTTP_AUTHORIZATION'])) {
    if (preg_match('/Bearer\s(\S+)/', $_SERVER['HTTP_AUTHORIZATION'], $matches)) {
        $token = $matches[1];
    }
}

if (!$token) {
    http_response_code(401);
    echo json_encode(["error" => "No token"]);
    exit;
}

$user = validateToken($token); // returns ['id'=>..., 'institution_id'=>..., 'role'=>...]
if (!$user) {
    http_response_code(403);
    echo json_encode(["error" => "Invalid token"]);
    exit;
}

$input = json_decode(file_get_contents("php://input"), true);

if (!$input || !isset($input['asset_id']) || !isset($input['transaction_type'])) {
    http_response_code(400);
    echo json_encode(["error" => "Missing parameters"]);
    exit;
}

$asset_id = $input['asset_id'];
$type = $input['transaction_type'];
$remarks = $input['remarks'] ?? '';
$toDept = $input['to_department_id'] ?? null;

try {
    $stmt = $db->prepare("INSERT INTO transactions 
        (institution_id, asset_id, transaction_type, from_user_id, to_department_id, remarks, performed_by)
        VALUES (:inst, :asset, :type, :from, :toDept, :remarks, :by)");
    $stmt->execute([
        ":inst" => $user['institution_id'],
        ":asset" => $asset_id,
        ":type" => $type,
        ":from" => $user['id'],
        ":toDept" => $toDept,
        ":remarks" => $remarks,
        ":by" => $user['id']
    ]);

    echo json_encode(["success" => true]);
} catch (Throwable $e) {
    http_response_code(500);
    echo json_encode(["error" => $e->getMessage()]);
}
