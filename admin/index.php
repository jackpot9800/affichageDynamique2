<?php
session_start();
require_once 'config/database.php';
require_once 'includes/functions.php';

// Vérification de la connexion à la base de données
try {
    $pdo = new PDO("mysql:host=" . DB_HOST . ";dbname=" . DB_NAME . ";charset=utf8mb4", DB_USER, DB_PASS);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
} catch(PDOException $e) {
    die("Erreur de connexion : " . $e->getMessage());
}

// Statistiques rapides
$stats = getQuickStats($pdo);
?>
<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Administration - Affichage Dynamique</title>
    
    <!-- Bootstrap 5.3 CSS -->
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.2/dist/css/bootstrap.min.css" rel="stylesheet">
    <!-- Bootstrap Icons -->
    <link href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.1/font/bootstrap-icons.css" rel="stylesheet">
    <!-- Custom CSS -->
    <link href="assets/css/admin.css" rel="stylesheet">
</head>
<body>
    <!-- Navigation -->
    <nav class="navbar navbar-expand-lg navbar-dark bg-primary">
        <div class="container-fluid">
            <a class="navbar-brand" href="index.php">
                <i class="bi bi-display"></i> Affichage Dynamique
            </a>
            
            <button class="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbarNav">
                <span class="navbar-toggler-icon"></span>
            </button>
            
            <div class="collapse navbar-collapse" id="navbarNav">
                <ul class="navbar-nav me-auto">
                    <li class="nav-item">
                        <a class="nav-link active" href="index.php">
                            <i class="bi bi-house"></i> Tableau de bord
                        </a>
                    </li>
                    <li class="nav-item">
                        <a class="nav-link" href="presentations.php">
                            <i class="bi bi-collection-play"></i> Présentations
                        </a>
                    </li>
                    <li class="nav-item">
                        <a class="nav-link" href="appareils.php">
                            <i class="bi bi-tv"></i> Appareils
                        </a>
                    </li>
                    <li class="nav-item">
                        <a class="nav-link" href="diffusions.php">
                            <i class="bi bi-broadcast"></i> Diffusions
                        </a>
                    </li>
                    <li class="nav-item">
                        <a class="nav-link" href="medias.php">
                            <i class="bi bi-images"></i> Médias
                        </a>
                    </li>
                    <li class="nav-item">
                        <a class="nav-link" href="logs.php">
                            <i class="bi bi-journal-text"></i> Logs
                        </a>
                    </li>
                </ul>
                
                <ul class="navbar-nav">
                    <li class="nav-item dropdown">
                        <a class="nav-link dropdown-toggle" href="#" role="button" data-bs-toggle="dropdown">
                            <i class="bi bi-person-circle"></i> Admin
                        </a>
                        <ul class="dropdown-menu">
                            <li><a class="dropdown-item" href="settings.php"><i class="bi bi-gear"></i> Paramètres</a></li>
                            <li><hr class="dropdown-divider"></li>
                            <li><a class="dropdown-item" href="logout.php"><i class="bi bi-box-arrow-right"></i> Déconnexion</a></li>
                        </ul>
                    </li>
                </ul>
            </div>
        </div>
    </nav>

    <!-- Contenu principal -->
    <div class="container-fluid mt-4">
        <!-- Statistiques -->
        <div class="row mb-4">
            <div class="col-md-3">
                <div class="card bg-primary text-white">
                    <div class="card-body">
                        <div class="d-flex justify-content-between">
                            <div>
                                <h4 class="card-title"><?= $stats['presentations'] ?></h4>
                                <p class="card-text">Présentations</p>
                            </div>
                            <div class="align-self-center">
                                <i class="bi bi-collection-play fs-1"></i>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            
            <div class="col-md-3">
                <div class="card bg-success text-white">
                    <div class="card-body">
                        <div class="d-flex justify-content-between">
                            <div>
                                <h4 class="card-title"><?= $stats['appareils_actifs'] ?></h4>
                                <p class="card-text">Appareils actifs</p>
                            </div>
                            <div class="align-self-center">
                                <i class="bi bi-tv fs-1"></i>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            
            <div class="col-md-3">
                <div class="card bg-warning text-white">
                    <div class="card-body">
                        <div class="d-flex justify-content-between">
                            <div>
                                <h4 class="card-title"><?= $stats['diffusions_actives'] ?></h4>
                                <p class="card-text">Diffusions actives</p>
                            </div>
                            <div class="align-self-center">
                                <i class="bi bi-broadcast fs-1"></i>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            
            <div class="col-md-3">
                <div class="card bg-info text-white">
                    <div class="card-body">
                        <div class="d-flex justify-content-between">
                            <div>
                                <h4 class="card-title"><?= $stats['medias'] ?></h4>
                                <p class="card-text">Médias</p>
                            </div>
                            <div class="align-self-center">
                                <i class="bi bi-images fs-1"></i>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <!-- Actions rapides -->
        <div class="row mb-4">
            <div class="col-12">
                <div class="card">
                    <div class="card-header">
                        <h5 class="card-title mb-0">
                            <i class="bi bi-lightning"></i> Actions rapides
                        </h5>
                    </div>
                    <div class="card-body">
                        <div class="row">
                            <div class="col-md-3 mb-3">
                                <a href="presentations.php?action=create" class="btn btn-primary w-100">
                                    <i class="bi bi-plus-circle"></i><br>
                                    Nouvelle présentation
                                </a>
                            </div>
                            <div class="col-md-3 mb-3">
                                <a href="appareils.php" class="btn btn-success w-100">
                                    <i class="bi bi-tv"></i><br>
                                    Gérer les appareils
                                </a>
                            </div>
                            <div class="col-md-3 mb-3">
                                <a href="diffusions.php?action=create" class="btn btn-warning w-100">
                                    <i class="bi bi-broadcast"></i><br>
                                    Programmer diffusion
                                </a>
                            </div>
                            <div class="col-md-3 mb-3">
                                <a href="medias.php?action=upload" class="btn btn-info w-100">
                                    <i class="bi bi-cloud-upload"></i><br>
                                    Uploader média
                                </a>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <!-- Activité récente -->
        <div class="row">
            <div class="col-md-8">
                <div class="card">
                    <div class="card-header">
                        <h5 class="card-title mb-0">
                            <i class="bi bi-clock-history"></i> Activité récente
                        </h5>
                    </div>
                    <div class="card-body">
                        <div class="table-responsive">
                            <table class="table table-hover">
                                <thead>
                                    <tr>
                                        <th>Heure</th>
                                        <th>Action</th>
                                        <th>Appareil</th>
                                        <th>Détails</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <?php
                                    $recent_logs = getRecentLogs($pdo, 10);
                                    foreach($recent_logs as $log):
                                    ?>
                                    <tr>
                                        <td><?= date('H:i', strtotime($log['date_action'])) ?></td>
                                        <td>
                                            <span class="badge bg-<?= getLogBadgeColor($log['type_action']) ?>">
                                                <?= ucfirst($log['type_action']) ?>
                                            </span>
                                        </td>
                                        <td><?= htmlspecialchars($log['identifiant_appareil'] ?? 'N/A') ?></td>
                                        <td><?= htmlspecialchars($log['message']) ?></td>
                                    </tr>
                                    <?php endforeach; ?>
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>
            
            <div class="col-md-4">
                <div class="card">
                    <div class="card-header">
                        <h5 class="card-title mb-0">
                            <i class="bi bi-exclamation-triangle"></i> Alertes système
                        </h5>
                    </div>
                    <div class="card-body">
                        <?php
                        $alerts = getSystemAlerts($pdo);
                        if(empty($alerts)):
                        ?>
                        <div class="alert alert-success">
                            <i class="bi bi-check-circle"></i> Tout fonctionne normalement
                        </div>
                        <?php else: ?>
                        <?php foreach($alerts as $alert): ?>
                        <div class="alert alert-<?= $alert['type'] ?>">
                            <strong><?= $alert['title'] ?></strong><br>
                            <?= $alert['message'] ?>
                        </div>
                        <?php endforeach; ?>
                        <?php endif; ?>
                    </div>
                </div>
            </div>
        </div>
    </div>

    <!-- Bootstrap JS -->
    <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.2/dist/js/bootstrap.bundle.min.js"></script>
    <!-- Custom JS -->
    <script src="assets/js/admin.js"></script>
</body>
</html>