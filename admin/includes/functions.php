<?php
/**
 * Fonctions utilitaires pour l'administration
 * PHP 8.2 - Affichage Dynamique
 */

/**
 * Obtient les statistiques rapides du tableau de bord
 */
function getQuickStats(PDO $pdo): array {
    try {
        // Nombre de présentations actives
        $stmt = $pdo->query("SELECT COUNT(*) FROM presentations WHERE statut = 'actif'");
        $presentations = $stmt->fetchColumn();
        
        // Nombre d'appareils actifs
        $stmt = $pdo->query("SELECT COUNT(*) FROM appareils WHERE statut = 'actif'");
        $appareils_actifs = $stmt->fetchColumn();
        
        // Nombre de diffusions actives
        $stmt = $pdo->query("
            SELECT COUNT(*) FROM diffusions 
            WHERE statut = 'active' 
            AND (date_fin IS NULL OR date_fin > NOW())
        ");
        $diffusions_actives = $stmt->fetchColumn();
        
        // Nombre de médias
        $stmt = $pdo->query("SELECT COUNT(*) FROM medias WHERE statut = 'actif'");
        $medias = $stmt->fetchColumn();
        
        return [
            'presentations' => $presentations,
            'appareils_actifs' => $appareils_actifs,
            'diffusions_actives' => $diffusions_actives,
            'medias' => $medias
        ];
    } catch(PDOException $e) {
        error_log("Erreur getQuickStats: " . $e->getMessage());
        return [
            'presentations' => 0,
            'appareils_actifs' => 0,
            'diffusions_actives' => 0,
            'medias' => 0
        ];
    }
}

/**
 * Obtient les logs récents
 */
function getRecentLogs(PDO $pdo, int $limit = 10): array {
    try {
        $stmt = $pdo->prepare("
            SELECT * FROM logs_activite 
            ORDER BY date_action DESC 
            LIMIT ?
        ");
        $stmt->execute([$limit]);
        return $stmt->fetchAll();
    } catch(PDOException $e) {
        error_log("Erreur getRecentLogs: " . $e->getMessage());
        return [];
    }
}

/**
 * Obtient la couleur du badge pour les logs
 */
function getLogBadgeColor(string $type_action): string {
    return match($type_action) {
        'connexion' => 'success',
        'diffusion' => 'primary',
        'erreur' => 'danger',
        'maintenance' => 'warning',
        default => 'secondary'
    };
}

/**
 * Obtient les alertes système
 */
function getSystemAlerts(PDO $pdo): array {
    $alerts = [];
    
    try {
        // Vérifier les appareils déconnectés depuis plus de 24h
        $stmt = $pdo->query("
            SELECT COUNT(*) FROM appareils 
            WHERE derniere_connexion < DATE_SUB(NOW(), INTERVAL 24 HOUR)
            AND statut = 'actif'
        ");
        $appareils_deconnectes = $stmt->fetchColumn();
        
        if($appareils_deconnectes > 0) {
            $alerts[] = [
                'type' => 'warning',
                'title' => 'Appareils déconnectés',
                'message' => "$appareils_deconnectes appareil(s) non connecté(s) depuis plus de 24h"
            ];
        }
        
        // Vérifier les erreurs récentes
        $stmt = $pdo->query("
            SELECT COUNT(*) FROM logs_activite 
            WHERE type_action = 'erreur' 
            AND date_action > DATE_SUB(NOW(), INTERVAL 1 HOUR)
        ");
        $erreurs_recentes = $stmt->fetchColumn();
        
        if($erreurs_recentes > 5) {
            $alerts[] = [
                'type' => 'danger',
                'title' => 'Erreurs fréquentes',
                'message' => "$erreurs_recentes erreurs détectées dans la dernière heure"
            ];
        }
        
        // Vérifier l'espace disque (simulation)
        $upload_size = getDirSize(UPLOAD_PATH);
        if($upload_size > 500 * 1024 * 1024) { // 500MB
            $alerts[] = [
                'type' => 'info',
                'title' => 'Espace de stockage',
                'message' => 'Le dossier uploads utilise ' . formatBytes($upload_size)
            ];
        }
        
    } catch(PDOException $e) {
        error_log("Erreur getSystemAlerts: " . $e->getMessage());
    }
    
    return $alerts;
}

/**
 * Calcule la taille d'un dossier
 */
function getDirSize(string $directory): int {
    $size = 0;
    if(is_dir($directory)) {
        foreach(new RecursiveIteratorIterator(new RecursiveDirectoryIterator($directory)) as $file) {
            if($file->isFile()) {
                $size += $file->getSize();
            }
        }
    }
    return $size;
}

/**
 * Formate les octets en unités lisibles
 */
function formatBytes(int $bytes, int $precision = 2): string {
    $units = ['B', 'KB', 'MB', 'GB', 'TB'];
    
    for($i = 0; $bytes > 1024 && $i < count($units) - 1; $i++) {
        $bytes /= 1024;
    }
    
    return round($bytes, $precision) . ' ' . $units[$i];
}

/**
 * Sécurise une chaîne pour l'affichage HTML
 */
function secure(string $string): string {
    return htmlspecialchars($string, ENT_QUOTES, 'UTF-8');
}

/**
 * Génère un token CSRF
 */
function generateCSRFToken(): string {
    if(!isset($_SESSION['csrf_token'])) {
        $_SESSION['csrf_token'] = bin2hex(random_bytes(32));
    }
    return $_SESSION['csrf_token'];
}

/**
 * Vérifie un token CSRF
 */
function verifyCSRFToken(string $token): bool {
    return isset($_SESSION['csrf_token']) && hash_equals($_SESSION['csrf_token'], $token);
}

/**
 * Redirige avec un message flash
 */
function redirect(string $url, string $message = '', string $type = 'success'): void {
    if($message) {
        $_SESSION['flash_message'] = $message;
        $_SESSION['flash_type'] = $type;
    }
    header("Location: $url");
    exit;
}

/**
 * Affiche et supprime le message flash
 */
function getFlashMessage(): ?array {
    if(isset($_SESSION['flash_message'])) {
        $message = [
            'text' => $_SESSION['flash_message'],
            'type' => $_SESSION['flash_type'] ?? 'success'
        ];
        unset($_SESSION['flash_message'], $_SESSION['flash_type']);
        return $message;
    }
    return null;
}

/**
 * Valide un fichier uploadé
 */
function validateUploadedFile(array $file, array $allowed_types = ['image/jpeg', 'image/png', 'image/gif', 'video/mp4']): array {
    $errors = [];
    
    // Vérifier les erreurs d'upload
    if($file['error'] !== UPLOAD_ERR_OK) {
        $errors[] = "Erreur lors de l'upload du fichier";
        return $errors;
    }
    
    // Vérifier la taille
    if($file['size'] > MAX_FILE_SIZE) {
        $errors[] = "Le fichier est trop volumineux (max: " . formatBytes(MAX_FILE_SIZE) . ")";
    }
    
    // Vérifier le type MIME
    $finfo = finfo_open(FILEINFO_MIME_TYPE);
    $mime_type = finfo_file($finfo, $file['tmp_name']);
    finfo_close($finfo);
    
    if(!in_array($mime_type, $allowed_types)) {
        $errors[] = "Type de fichier non autorisé";
    }
    
    return $errors;
}

/**
 * Génère un nom de fichier sécurisé
 */
function generateSecureFilename(string $original_name): string {
    $extension = pathinfo($original_name, PATHINFO_EXTENSION);
    $filename = pathinfo($original_name, PATHINFO_FILENAME);
    
    // Nettoyer le nom de fichier
    $filename = preg_replace('/[^a-zA-Z0-9_-]/', '_', $filename);
    $filename = substr($filename, 0, 50); // Limiter la longueur
    
    // Ajouter un timestamp pour éviter les conflits
    return $filename . '_' . time() . '.' . strtolower($extension);
}