<?php
/**
 * Configuration de la base de données
 * PHP 8.2 - Affichage Dynamique
 */

// Configuration de la base de données
define('DB_HOST', 'localhost');
define('DB_NAME', 'affichageDynamique');
define('DB_USER', 'root');
define('DB_PASS', '');

// Configuration de l'application
define('APP_NAME', 'Affichage Dynamique');
define('APP_VERSION', '2.0');
define('UPLOAD_PATH', '../uploads/');
define('MAX_FILE_SIZE', 10 * 1024 * 1024); // 10MB

// Fuseau horaire
date_default_timezone_set('Europe/Paris');

// Configuration des erreurs pour PHP 8.2
error_reporting(E_ALL);
ini_set('display_errors', 1);

/**
 * Connexion PDO sécurisée
 */
function getDbConnection(): PDO {
    try {
        $dsn = "mysql:host=" . DB_HOST . ";dbname=" . DB_NAME . ";charset=utf8mb4";
        $options = [
            PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
            PDO::ATTR_EMULATE_PREPARES => false,
            PDO::MYSQL_ATTR_INIT_COMMAND => "SET NAMES utf8mb4"
        ];
        
        return new PDO($dsn, DB_USER, DB_PASS, $options);
    } catch(PDOException $e) {
        error_log("Erreur de connexion DB: " . $e->getMessage());
        throw new Exception("Erreur de connexion à la base de données");
    }
}

/**
 * Fonction de logging sécurisée
 */
function logAction(PDO $pdo, string $type_action, ?int $appareil_id, ?string $identifiant_appareil, ?int $presentation_id, string $message, array $details = []): void {
    try {
        $stmt = $pdo->prepare("
            INSERT INTO logs_activite 
            (type_action, appareil_id, identifiant_appareil, presentation_id, message, details, adresse_ip, user_agent)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        ");
        
        $stmt->execute([
            $type_action,
            $appareil_id,
            $identifiant_appareil,
            $presentation_id,
            $message,
            json_encode($details, JSON_UNESCAPED_UNICODE),
            $_SERVER['REMOTE_ADDR'] ?? '',
            $_SERVER['HTTP_USER_AGENT'] ?? ''
        ]);
    } catch(PDOException $e) {
        error_log("Erreur lors du logging: " . $e->getMessage());
    }
}