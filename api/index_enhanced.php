<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, X-Device-ID, X-Device-Type, X-Enrollment-Token, X-Device-Registered, X-App-Version, User-Agent');

// Gestion des requêtes OPTIONS (preflight CORS)
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

error_reporting(0);
ini_set('display_errors', 0);
ini_set('display_startup_errors', 0);

// Fonction pour générer une réponse JSON
function jsonResponse($data, $status = 200) {
    http_response_code($status);
    echo json_encode($data);
    exit;
}

// Fonction pour logger les erreurs sans les afficher
function logError($message, $context = []) {
    $logMessage = date('Y-m-d H:i:s') . ' - ' . $message;
    if (!empty($context)) {
        $logMessage .= ' - Context: ' . json_encode($context);
    }
    error_log($logMessage);
}

// Récupérer la méthode HTTP et le chemin
$method = $_SERVER['REQUEST_METHOD'];

// Récupérer le chemin de la requête
$path = '';
if (isset($_SERVER['PATH_INFO'])) {
    $path = $_SERVER['PATH_INFO'];
} elseif (isset($_SERVER['REQUEST_URI'])) {
    $uri = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);
    $basePath = dirname($_SERVER['SCRIPT_NAME']);
    $path = substr($uri, strlen($basePath));
}

$path = trim($path, '/');

// Log pour debug
logError("API Request", ['method' => $method, 'path' => $path]);

// Si pas de chemin, retourner les informations de base
if (empty($path)) {
    jsonResponse([
        'status' => 'API is running',
        'version' => '2.0',
        'timestamp' => date('c'),
        'endpoints' => [
            'GET /presentations' => 'List all presentations',
            'GET /presentation/{id}' => 'Get presentation details',
            'POST /device/register' => 'Register a device',
            'GET /device/assigned-presentation' => 'Get assigned presentation for device',
            'GET /device/default-presentation' => 'Get default presentation for device',
            'POST /device/presentation/{id}/viewed' => 'Mark presentation as viewed',
            'POST /admin/assign-presentation' => 'Assign presentation to device(s)',
            'GET /admin/devices' => 'List all devices',
            'GET /debug/device/{device_id}' => 'Debug device information',
            'GET /version' => 'Get API version'
        ]
    ]);
}

// Connexion à la base de données
try {
    require_once('dbpdointranet.php');
    $dbpdointranet->exec("USE carousel_db");
} catch (Exception $e) {
    jsonResponse(['error' => 'Database connection failed: ' . $e->getMessage()], 500);
}

// Router les requêtes
switch ($path) {
    case 'version':
        jsonResponse([
            'version' => '2.0',
            'api_status' => 'running',
            'timestamp' => date('c'),
            'php_version' => PHP_VERSION,
            'features' => [
                'presentations',
                'device_registration',
                'presentation_assignment',
                'default_presentations',
                'auto_play',
                'loop_mode',
                'direct_device_id_assignment',
                'debug_endpoints'
            ],
            'endpoints' => [
                'GET /device/assigned-presentation' => 'Get assigned presentation for device',
                'GET /device/default-presentation' => 'Get default presentation for device',
                'GET /debug/device/{device_id}' => 'Debug device information'
            ]
        ]);
        break;
        
    case 'presentations':
        if ($method === 'GET') {
            try {
                $stmt = $dbpdointranet->query("
                    SELECT p.*, COUNT(ps.slide_id) as slide_count
                    FROM presentations p
                    LEFT JOIN presentation_slides ps ON p.id = ps.presentation_id
                    GROUP BY p.id
                    ORDER BY p.created_at DESC
                ");
                $presentations = $stmt->fetchAll(PDO::FETCH_ASSOC);
                
                // Nettoyer et valider les données
                foreach ($presentations as &$pres) {
                    // S'assurer que slide_count est un entier
                    $pres['slide_count'] = (int)($pres['slide_count'] ?? 0);
                    
                    // Ajouter une description par défaut si manquante
                    if (empty($pres['description'])) {
                        $pres['description'] = 'Aucune description disponible';
                    }
                    
                    // Générer l'URL de prévisualisation
                    $pres['preview_url'] = sprintf(
                        'http://%s/mods/livetv/chromecast_display.php?presentation=%d&key=android_%s',
                        $_SERVER['HTTP_HOST'],
                        $pres['id'],
                        uniqid()
                    );
                }
                
                logError("Presentations fetched", ['count' => count($presentations)]);
                jsonResponse(['presentations' => $presentations]);
                
            } catch (PDOException $e) {
                logError("Database error in presentations", ['error' => $e->getMessage()]);
                jsonResponse(['error' => 'Database error while fetching presentations'], 500);
            }
        } else {
            jsonResponse(['error' => 'Method not allowed'], 405);
        }
        break;

    case 'device/register':
        if ($method === 'POST') {
            try {
                $input = file_get_contents('php://input');
                $data = json_decode($input, true);
                
                if (json_last_error() !== JSON_ERROR_NONE) {
                    jsonResponse(['error' => 'Invalid JSON in request body'], 400);
                }
                
                // Validation des champs requis
                if (empty($data['device_id']) || empty($data['name'])) {
                    jsonResponse(['error' => 'Missing required fields: device_id and name'], 400);
                }
                
                // Vérifier si la table displays existe
                $tableCheck = $dbpdointranet->query("SHOW TABLES LIKE 'displays'");
                if ($tableCheck->rowCount() === 0) {
                    // Créer la table si elle n'existe pas
                    $dbpdointranet->exec("
                        CREATE TABLE IF NOT EXISTS displays (
                            id INT AUTO_INCREMENT PRIMARY KEY,
                            name VARCHAR(255) NOT NULL,
                            device_type VARCHAR(50) NOT NULL DEFAULT 'android',
                            device_id VARCHAR(255) UNIQUE NOT NULL,
                            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                            last_seen TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                            active TINYINT(1) DEFAULT 1,
                            capabilities JSON,
                            location VARCHAR(255),
                            group_name VARCHAR(255),
                            default_display_presentation_id INT DEFAULT 0
                        )
                    ");
                }
                
                // Vérifier si la colonne default_display_presentation_id existe
                $columnCheck = $dbpdointranet->query("
                    SELECT COLUMN_NAME 
                    FROM INFORMATION_SCHEMA.COLUMNS 
                    WHERE TABLE_SCHEMA = 'carousel_db' 
                    AND TABLE_NAME = 'displays' 
                    AND COLUMN_NAME = 'default_display_presentation_id'
                ");
                
                if ($columnCheck->rowCount() === 0) {
                    // Ajouter la colonne default_display_presentation_id
                    $dbpdointranet->exec("
                        ALTER TABLE displays 
                        ADD COLUMN default_display_presentation_id INT DEFAULT 0
                    ");
                    logError("Added default_display_presentation_id column to displays table");
                }
                
                // Vérifier si la table presentation_displays existe avec la nouvelle structure
                $tableCheck = $dbpdointranet->query("SHOW TABLES LIKE 'presentation_displays'");
                if ($tableCheck->rowCount() === 0) {
                    // Créer la table avec device_id directement
                    $dbpdointranet->exec("
                        CREATE TABLE IF NOT EXISTS presentation_displays (
                            id INT AUTO_INCREMENT PRIMARY KEY,
                            presentation_id INT NOT NULL,
                            display_id INT NOT NULL,
                            device_id VARCHAR(255) NOT NULL,
                            start_time TIMESTAMP NULL DEFAULT NULL,
                            end_time TIMESTAMP NULL DEFAULT NULL,
                            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                            auto_play TINYINT(1) DEFAULT 0,
                            loop_mode TINYINT(1) DEFAULT 0,
                            viewed_at TIMESTAMP NULL DEFAULT NULL,
                            UNIQUE INDEX unique_device_assignment (device_id),
                            INDEX presentation_id (presentation_id),
                            INDEX display_id (display_id),
                            CONSTRAINT presentation_displays_ibfk_1 FOREIGN KEY (presentation_id) REFERENCES presentations (id) ON DELETE CASCADE,
                            CONSTRAINT presentation_displays_ibfk_2 FOREIGN KEY (display_id) REFERENCES displays (id) ON DELETE CASCADE
                        )
                    ");
                } else {
                    // Vérifier si la colonne device_id existe, sinon l'ajouter
                    $columnCheck = $dbpdointranet->query("
                        SELECT COLUMN_NAME 
                        FROM INFORMATION_SCHEMA.COLUMNS 
                        WHERE TABLE_SCHEMA = 'carousel_db' 
                        AND TABLE_NAME = 'presentation_displays' 
                        AND COLUMN_NAME = 'device_id'
                    ");
                    
                    if ($columnCheck->rowCount() === 0) {
                        // Ajouter la colonne device_id
                        $dbpdointranet->exec("
                            ALTER TABLE presentation_displays 
                            ADD COLUMN device_id VARCHAR(255) NOT NULL AFTER display_id,
                            ADD UNIQUE INDEX unique_device_assignment (device_id)
                        ");
                        
                        logError("Added device_id column to presentation_displays table");
                    }
                }
                
                // Enregistrer ou mettre à jour l'appareil
                $stmt = $dbpdointranet->prepare("
                    INSERT INTO displays (name, device_type, device_id, created_at, last_seen, capabilities, default_display_presentation_id)
                    VALUES (?, ?, ?, NOW(), NOW(), ?, 0)
                    ON DUPLICATE KEY UPDATE 
                        last_seen = NOW(),
                        name = VALUES(name),
                        active = 1,
                        capabilities = VALUES(capabilities)
                ");
                
                $deviceType = $data['type'] ?? 'firetv';
                $capabilities = json_encode($data['capabilities'] ?? []);
                $stmt->execute([$data['name'], $deviceType, $data['device_id'], $capabilities]);
                
                logError("Device registered", [
                    'device_id' => $data['device_id'],
                    'name' => $data['name'],
                    'type' => $deviceType
                ]);
                
                jsonResponse([
                    'success' => true,
                    'message' => 'Device registered successfully',
                    'device_id' => $data['device_id'],
                    'token' => 'enrolled_' . uniqid()
                ]);
                
            } catch (PDOException $e) {
                logError("Database error in device registration", ['error' => $e->getMessage()]);
                jsonResponse(['error' => 'Database error during device registration'], 500);
            } catch (Exception $e) {
                logError("General error in device registration", ['error' => $e->getMessage()]);
                jsonResponse(['error' => 'Error during device registration'], 500);
            }
        } else {
            jsonResponse(['error' => 'Method not allowed'], 405);
        }
        break;

    case 'device/assigned-presentation':
        if ($method === 'GET') {
            try {
                $deviceId = $_SERVER['HTTP_X_DEVICE_ID'] ?? '';
                
                if (empty($deviceId)) {
                    jsonResponse(['error' => 'Device ID required'], 400);
                }
                
                logError("Checking assigned presentation", ['device_id' => $deviceId]);
                
                // Utiliser directement device_id dans presentation_displays
                $stmt = $dbpdointranet->prepare("
                    SELECT pd.*, p.name as presentation_name, p.description as presentation_description
                    FROM presentation_displays pd
                    JOIN presentations p ON pd.presentation_id = p.id
                    WHERE pd.device_id = ? 
                    AND (pd.end_time IS NULL OR pd.end_time > NOW())
                    AND (pd.start_time IS NULL OR pd.start_time <= NOW())
                    ORDER BY pd.created_at DESC
                    LIMIT 1
                ");
                $stmt->execute([$deviceId]);
                $assignedPresentation = $stmt->fetch(PDO::FETCH_ASSOC);
                
                if ($assignedPresentation) {
                    logError("Assigned presentation found", [
                        'device_id' => $deviceId,
                        'presentation_id' => $assignedPresentation['presentation_id'],
                        'auto_play' => $assignedPresentation['auto_play'],
                        'loop_mode' => $assignedPresentation['loop_mode']
                    ]);
                } else {
                    logError("No assigned presentation", ['device_id' => $deviceId]);
                }
                
                jsonResponse(['assigned_presentation' => $assignedPresentation]);
                
            } catch (PDOException $e) {
                logError("Database error in assigned presentation", ['error' => $e->getMessage()]);
                jsonResponse(['error' => 'Database error while fetching assigned presentation'], 500);
            }
        } else {
            jsonResponse(['error' => 'Method not allowed'], 405);
        }
        break;

    case 'device/default-presentation':
        if ($method === 'GET') {
            try {
                // Récupérer le device_id depuis les headers
                $deviceId = '';
                if (isset($_SERVER['HTTP_X_DEVICE_ID'])) {
                    $deviceId = $_SERVER['HTTP_X_DEVICE_ID'];
                }
                
                if (empty($deviceId)) {
                    jsonResponse(['error' => 'Device ID required'], 400);
                }
                
                logError("Checking default presentation for device", ['device_id' => $deviceId]);
                
                // Requête pour vérifier la présentation par défaut
                $stmt = $dbpdointranet->prepare("
                    SELECT 
                        d.default_display_presentation_id, 
                        d.device_id,
                        d.name as device_name,
                        p.id as presentation_id,
                        p.name as presentation_name, 
                        p.description as presentation_description,
                        COUNT(ps.slide_id) as slide_count
                    FROM displays d
                    LEFT JOIN presentations p ON d.default_display_presentation_id = p.id
                    LEFT JOIN presentation_slides ps ON p.id = ps.presentation_id
                    WHERE d.device_id = ? 
                    AND d.default_display_presentation_id > 0
                    GROUP BY d.id, p.id
                ");
                $stmt->execute([$deviceId]);
                $result = $stmt->fetch(PDO::FETCH_ASSOC);
                
                logError("Default presentation query result", ['result' => $result]);
                
                if ($result && $result['default_display_presentation_id'] > 0 && $result['presentation_id']) {
                    $defaultPresentation = [
                        'presentation_id' => (int)$result['presentation_id'],
                        'presentation_name' => $result['presentation_name'],
                        'presentation_description' => $result['presentation_description'] ?: 'Présentation par défaut',
                        'slide_count' => (int)($result['slide_count'] ?: 0),
                        'is_default' => true
                    ];
                    
                    logError("Returning default presentation", ['default_presentation' => $defaultPresentation]);
                    jsonResponse(['default_presentation' => $defaultPresentation]);
                } else {
                    logError("No default presentation found", ['device_id' => $deviceId]);
                    jsonResponse(['default_presentation' => null]);
                }
                
            } catch (PDOException $e) {
                logError("Database error in default-presentation", ['error' => $e->getMessage()]);
                jsonResponse(['error' => 'Database error: ' . $e->getMessage()], 500);
            }
        } else {
            jsonResponse(['error' => 'Method not allowed'], 405);
        }
        break;

    case 'admin/assign-presentation':
        if ($method === 'POST') {
            try {
                $input = file_get_contents('php://input');
                $data = json_decode($input, true);
                
                if (json_last_error() !== JSON_ERROR_NONE) {
                    jsonResponse(['error' => 'Invalid JSON in request body'], 400);
                }
                
                // Validation des champs requis
                if (empty($data['presentation_id'])) {
                    jsonResponse(['error' => 'Missing required field: presentation_id'], 400);
                }
                
                $presentationId = (int)$data['presentation_id'];
                $deviceIds = $data['device_ids'] ?? []; // Array de device_id (string)
                $autoPlay = (bool)($data['auto_play'] ?? false);
                $loopMode = (bool)($data['loop_mode'] ?? false);
                $startTime = $data['start_time'] ?? null;
                $endTime = $data['end_time'] ?? null;
                
                // Si aucun device_id spécifié, assigner à tous les appareils actifs
                if (empty($deviceIds)) {
                    $stmt = $dbpdointranet->query("SELECT device_id FROM displays WHERE active = 1");
                    $devices = $stmt->fetchAll(PDO::FETCH_COLUMN);
                    $deviceIds = $devices;
                }
                
                // Vérifier que la présentation existe
                $stmt = $dbpdointranet->prepare("SELECT id FROM presentations WHERE id = ?");
                $stmt->execute([$presentationId]);
                if (!$stmt->fetch()) {
                    jsonResponse(['error' => 'Presentation not found'], 404);
                }
                
                // Assigner directement avec device_id
                $stmt = $dbpdointranet->prepare("
                    INSERT INTO presentation_displays 
                    (presentation_id, display_id, device_id, start_time, end_time, auto_play, loop_mode, created_at)
                    SELECT ?, d.id, ?, ?, ?, ?, ?, NOW()
                    FROM displays d 
                    WHERE d.device_id = ?
                    ON DUPLICATE KEY UPDATE
                        presentation_id = VALUES(presentation_id),
                        start_time = VALUES(start_time),
                        end_time = VALUES(end_time),
                        auto_play = VALUES(auto_play),
                        loop_mode = VALUES(loop_mode),
                        viewed_at = NULL
                ");
                
                $successCount = 0;
                foreach ($deviceIds as $deviceId) {
                    try {
                        $stmt->execute([
                            $presentationId,
                            $deviceId, // device_id pour la colonne device_id
                            $startTime,
                            $endTime,
                            $autoPlay ? 1 : 0,
                            $loopMode ? 1 : 0,
                            $deviceId  // device_id pour la clause WHERE
                        ]);
                        $successCount++;
                    } catch (PDOException $e) {
                        // Log l'erreur mais continue avec les autres appareils
                        logError("Failed to assign to device", [
                            'device_id' => $deviceId,
                            'error' => $e->getMessage()
                        ]);
                    }
                }
                
                logError("Presentation assigned", [
                    'presentation_id' => $presentationId,
                    'devices_targeted' => count($deviceIds),
                    'devices_success' => $successCount,
                    'auto_play' => $autoPlay,
                    'loop_mode' => $loopMode
                ]);
                
                jsonResponse([
                    'success' => true,
                    'message' => "Presentation assigned to {$successCount} device(s)",
                    'presentation_id' => $presentationId,
                    'devices_targeted' => count($deviceIds),
                    'devices_success' => $successCount
                ]);
                
            } catch (PDOException $e) {
                logError("Database error in assign presentation", ['error' => $e->getMessage()]);
                jsonResponse(['error' => 'Database error while assigning presentation'], 500);
            } catch (Exception $e) {
                logError("General error in assign presentation", ['error' => $e->getMessage()]);
                jsonResponse(['error' => 'Error while assigning presentation'], 500);
            }
        } else {
            jsonResponse(['error' => 'Method not allowed'], 405);
        }
        break;

    case 'admin/devices':
        if ($method === 'GET') {
            try {
                // Récupérer la liste des appareils connectés
                $stmt = $dbpdointranet->query("
                    SELECT d.*, 
                           p.name as default_presentation_name,
                           p.description as default_presentation_description
                    FROM displays d
                    LEFT JOIN presentations p ON d.default_display_presentation_id = p.id
                    ORDER BY d.last_seen DESC
                ");
                $devices = $stmt->fetchAll(PDO::FETCH_ASSOC);
                
                // Nettoyer les données
                foreach ($devices as &$device) {
                    $device['capabilities'] = json_decode($device['capabilities'] ?? '[]', true);
                    $device['default_display_presentation_id'] = (int)($device['default_display_presentation_id'] ?? 0);
                    $device['active'] = (bool)($device['active'] ?? true);
                }
                
                jsonResponse(['devices' => $devices]);
                
            } catch (PDOException $e) {
                logError("Database error in admin devices", ['error' => $e->getMessage()]);
                jsonResponse(['error' => 'Database error while fetching devices'], 500);
            }
        } else {
            jsonResponse(['error' => 'Method not allowed'], 405);
        }
        break;

    default:
        // Vérifier si c'est une requête de debug
        if (preg_match('/^debug\/device\/(.+)$/', $path, $matches)) {
            if ($method === 'GET') {
                $deviceId = $matches[1];
                try {
                    logError("Debug request for device", ['device_id' => $deviceId]);
                    
                    // Récupérer les informations de l'appareil
                    $stmt = $dbpdointranet->prepare("
                        SELECT 
                            d.*,
                            p.id as default_presentation_id,
                            p.name as default_presentation_name,
                            p.description as default_presentation_description
                        FROM displays d
                        LEFT JOIN presentations p ON d.default_display_presentation_id = p.id
                        WHERE d.device_id = ?
                    ");
                    $stmt->execute([$deviceId]);
                    $device = $stmt->fetch(PDO::FETCH_ASSOC);
                    
                    if (!$device) {
                        jsonResponse([
                            'error' => 'Device not found',
                            'device_id' => $deviceId,
                            'registered' => false
                        ], 404);
                    }
                    
                    // Vérifier si la présentation par défaut existe
                    $defaultPresentationExists = false;
                    if ($device['default_display_presentation_id'] > 0) {
                        $stmt = $dbpdointranet->prepare("SELECT id FROM presentations WHERE id = ?");
                        $stmt->execute([$device['default_display_presentation_id']]);
                        $defaultPresentationExists = $stmt->rowCount() > 0;
                    }
                    
                    // Récupérer toutes les assignations (si la table existe)
                    $assignments = [];
                    try {
                        $stmt = $dbpdointranet->prepare("
                            SELECT * FROM presentation_displays 
                            WHERE device_id = ? OR display_id = ?
                        ");
                        $stmt->execute([$deviceId, $device['id']]);
                        $assignments = $stmt->fetchAll(PDO::FETCH_ASSOC);
                    } catch (PDOException $e) {
                        // Table presentation_displays n'existe peut-être pas
                        logError("presentation_displays table not found", ['error' => $e->getMessage()]);
                    }
                    
                    $debugInfo = [
                        'device_id' => $deviceId,
                        'device_name' => $device['name'],
                        'device_type' => $device['device_type'],
                        'registered' => true,
                        'last_seen' => $device['last_seen'],
                        'created_at' => $device['created_at'],
                        'default_display_presentation_id' => (int)$device['default_display_presentation_id'],
                        'default_presentation_exists' => $defaultPresentationExists,
                        'default_presentation_name' => $device['default_presentation_name'],
                        'default_presentation_description' => $device['default_presentation_description'],
                        'assignments' => $assignments,
                        'assignments_count' => count($assignments)
                    ];
                    
                    logError("Debug info", ['debug_info' => $debugInfo]);
                    jsonResponse($debugInfo);
                    
                } catch (PDOException $e) {
                    logError("Database error in debug", ['error' => $e->getMessage()]);
                    jsonResponse(['error' => 'Database error: ' . $e->getMessage()], 500);
                }
            }
        }
        // Vérifier si c'est une requête de présentation spécifique
        elseif (preg_match('/^presentation\/(\d+)$/', $path, $matches)) {
            if ($method === 'GET') {
                $presentationId = (int)$matches[1];
                
                try {
                    // Récupérer les informations de la présentation
                    $stmt = $dbpdointranet->prepare("
                        SELECT p.*, COUNT(ps.slide_id) as slide_count
                        FROM presentations p
                        LEFT JOIN presentation_slides ps ON p.id = ps.presentation_id
                        WHERE p.id = ?
                        GROUP BY p.id
                    ");
                    $stmt->execute([$presentationId]);
                    $presentation = $stmt->fetch(PDO::FETCH_ASSOC);
                    
                    if (!$presentation) {
                        logError("Presentation not found", ['id' => $presentationId]);
                        jsonResponse(['error' => 'Presentation not found'], 404);
                    }
                    
                    // Récupérer les slides avec les VRAIES durées de presentation_slides
                    $stmt = $dbpdointranet->prepare("
                        SELECT 
                            s.id,
                            s.name,
                            s.title,
                            COALESCE(s.media_path, s.image_path, '') as image_path,
                            COALESCE(s.media_path, s.image_path, '') as media_path,
                            ps.duration as slide_duration,
                            ps.transition_type,
                            ps.position,
                            s.created_at
                        FROM presentation_slides ps
                        JOIN slides s ON ps.slide_id = s.id
                        WHERE ps.presentation_id = ?
                        ORDER BY ps.position ASC, s.id ASC
                    ");
                    $stmt->execute([$presentationId]);
                    $slides = $stmt->fetchAll(PDO::FETCH_ASSOC);
                    
                    logError("Raw slides from database", [
                        'presentation_id' => $presentationId,
                        'slides_count' => count($slides),
                        'first_slide_duration' => $slides[0]['slide_duration'] ?? 'N/A'
                    ]);
                    
                    // Traiter les slides avec gestion d'erreurs robuste
                    $validSlides = [];
                    foreach ($slides as $slide) {
                        // Utiliser media_path en priorité, puis image_path
                        $imagePath = $slide['media_path'] ?? $slide['image_path'] ?? '';
                        
                        // Construire l'URL de l'image
                        if (!empty($imagePath)) {
                            $slide['image_url'] = sprintf(
                                'http://%s/mods/livetv/%s',
                                $_SERVER['HTTP_HOST'],
                                $imagePath
                            );
                        } else {
                            // Image par défaut ou placeholder
                            $slide['image_url'] = sprintf(
                                'http://%s/mods/livetv/assets/placeholder.jpg',
                                $_SERVER['HTTP_HOST']
                            );
                        }
                        
                        // Utiliser slide_duration de presentation_slides, PAS de slides
                        $duration = (int)($slide['slide_duration'] ?? 5);
                        
                        // S'assurer que la durée est raisonnable
                        if ($duration < 1) {
                            $duration = 5;
                        }
                        if ($duration > 300) { // Max 5 minutes par slide
                            $duration = 300;
                        }
                        
                        logError("Processing slide", [
                            'slide_id' => $slide['id'],
                            'raw_duration' => $slide['slide_duration'],
                            'final_duration' => $duration,
                            'image_path' => $imagePath
                        ]);
                        
                        // Valider et nettoyer les autres champs
                        $processedSlide = [
                            'id' => (int)$slide['id'],
                            'name' => $slide['name'] ?? $slide['title'] ?? "Slide {$slide['id']}",
                            'title' => $slide['title'] ?? $slide['name'] ?? "Slide {$slide['id']}",
                            'image_path' => $imagePath,
                            'media_path' => $slide['media_path'] ?? $imagePath,
                            'image_url' => $slide['image_url'],
                            'duration' => $duration, // Utiliser la vraie durée de la DB
                            'transition_type' => $slide['transition_type'] ?? 'fade',
                            'position' => (int)($slide['position'] ?? 0),
                            'created_at' => $slide['created_at']
                        ];
                        
                        $validSlides[] = $processedSlide;
                    }
                    
                    logError("Final processed slides", [
                        'presentation_id' => $presentationId,
                        'valid_slides_count' => count($validSlides),
                        'durations' => array_map(function($s) { return $s['duration']; }, $validSlides)
                    ]);
                    
                    // Nettoyer les données de la présentation
                    $presentation['slide_count'] = count($validSlides);
                    $presentation['slides'] = $validSlides;
                    $presentation['description'] = $presentation['description'] ?? 'Aucune description disponible';
                    
                    // Générer l'URL de prévisualisation
                    $presentation['preview_url'] = sprintf(
                        'http://%s/mods/livetv/chromecast_display.php?presentation=%d&key=android_%s',
                        $_SERVER['HTTP_HOST'],
                        $presentation['id'],
                        uniqid()
                    );
                    
                    logError("Presentation fetched", [
                        'id' => $presentationId,
                        'name' => $presentation['name'],
                        'slides_count' => count($validSlides)
                    ]);
                    
                    jsonResponse(['presentation' => $presentation]);
                    
                } catch (PDOException $e) {
                    logError("Database error in presentation fetch", [
                        'id' => $presentationId,
                        'error' => $e->getMessage()
                    ]);
                    jsonResponse(['error' => 'Database error while fetching presentation'], 500);
                } catch (Exception $e) {
                    logError("General error in presentation fetch", [
                        'id' => $presentationId,
                        'error' => $e->getMessage()
                    ]);
                    jsonResponse(['error' => 'Error while fetching presentation'], 500);
                }
            } else {
                jsonResponse(['error' => 'Method not allowed'], 405);
            }
        }
        // Vérifier si c'est une requête pour marquer une présentation comme vue
        elseif (preg_match('/^device\/presentation\/(\d+)\/viewed$/', $path, $matches)) {
            if ($method === 'POST') {
                $presentationId = (int)$matches[1];
                $deviceId = $_SERVER['HTTP_X_DEVICE_ID'] ?? '';
                
                if (empty($deviceId)) {
                    jsonResponse(['error' => 'Device ID required'], 400);
                }
                
                try {
                    // Marquer directement avec device_id
                    $stmt = $dbpdointranet->prepare("
                        UPDATE presentation_displays 
                        SET viewed_at = NOW()
                        WHERE presentation_id = ? AND device_id = ?
                    ");
                    $stmt->execute([$presentationId, $deviceId]);
                    
                    if ($stmt->rowCount() > 0) {
                        logError("Presentation marked as viewed", [
                            'presentation_id' => $presentationId,
                            'device_id' => $deviceId
                        ]);
                        jsonResponse(['success' => true]);
                    } else {
                        jsonResponse(['error' => 'Assignment not found'], 404);
                    }
                    
                } catch (PDOException $e) {
                    logError("Database error marking presentation as viewed", ['error' => $e->getMessage()]);
                    jsonResponse(['error' => 'Database error'], 500);
                }
            } else {
                jsonResponse(['error' => 'Method not allowed'], 405);
            }
        }
        else {
            // Endpoint non trouvé
            jsonResponse([
                'error' => 'Endpoint not found',
                'requested_path' => $path,
                'method' => $method,
                'available_endpoints' => [
                    'GET /' => 'API information',
                    'GET /version' => 'API version',
                    'GET /presentations' => 'List all presentations',
                    'GET /presentation/{id}' => 'Get presentation details',
                    'POST /device/register' => 'Register a device',
                    'GET /device/assigned-presentation' => 'Get assigned presentation for device',
                    'GET /device/default-presentation' => 'Get default presentation for device',
                    'POST /device/presentation/{id}/viewed' => 'Mark presentation as viewed',
                    'POST /admin/assign-presentation' => 'Assign presentation to device(s)',
                    'GET /admin/devices' => 'List all devices',
                    'GET /debug/device/{device_id}' => 'Debug device information'
                ]
            ], 404);
        }
}
?>