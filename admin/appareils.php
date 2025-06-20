<?php
session_start();
require_once 'config/database.php';
require_once 'includes/functions.php';

$pdo = getDbConnection();

// Gestion des actions
$action = $_GET['action'] ?? 'list';
$message = getFlashMessage();

// Traitement des formulaires
if ($_POST) {
    if (!verifyCSRFToken($_POST['csrf_token'] ?? '')) {
        redirect('appareils.php', 'Token CSRF invalide', 'danger');
    }
    
    switch ($action) {
        case 'edit':
            $id = (int)$_POST['id'];
            $nom = trim($_POST['nom']);
            $localisation = trim($_POST['localisation']);
            $groupe_appareil = trim($_POST['groupe_appareil']);
            $presentation_defaut_id = (int)$_POST['presentation_defaut_id'];
            $statut = $_POST['statut'];
            
            try {
                $stmt = $pdo->prepare("
                    UPDATE appareils 
                    SET nom = ?, localisation = ?, groupe_appareil = ?, 
                        presentation_defaut_id = ?, statut = ?, date_modification = NOW()
                    WHERE id = ?
                ");
                $stmt->execute([$nom, $localisation, $groupe_appareil, $presentation_defaut_id, $statut, $id]);
                
                logAction($pdo, 'maintenance', $id, null, null, "Appareil modifié: $nom");
                redirect('appareils.php', 'Appareil modifié avec succès', 'success');
            } catch (PDOException $e) {
                $error = "Erreur lors de la modification: " . $e->getMessage();
            }
            break;
            
        case 'delete':
            $id = (int)$_POST['id'];
            try {
                $stmt = $pdo->prepare("DELETE FROM appareils WHERE id = ?");
                $stmt->execute([$id]);
                
                logAction($pdo, 'maintenance', null, null, null, "Appareil supprimé (ID: $id)");
                redirect('appareils.php', 'Appareil supprimé avec succès', 'success');
            } catch (PDOException $e) {
                $error = "Erreur lors de la suppression: " . $e->getMessage();
            }
            break;
    }
}

// Récupération des données
if ($action === 'edit' && isset($_GET['id'])) {
    $id = (int)$_GET['id'];
    $stmt = $pdo->prepare("SELECT * FROM appareils WHERE id = ?");
    $stmt->execute([$id]);
    $appareil = $stmt->fetch();
    
    if (!$appareil) {
        redirect('appareils.php', 'Appareil non trouvé', 'danger');
    }
}

// Liste des appareils avec pagination
$page = (int)($_GET['page'] ?? 1);
$limit = 20;
$offset = ($page - 1) * $limit;

$search = $_GET['search'] ?? '';
$filter_statut = $_GET['filter_statut'] ?? '';
$filter_groupe = $_GET['filter_groupe'] ?? '';

$where_conditions = [];
$params = [];

if ($search) {
    $where_conditions[] = "(nom LIKE ? OR identifiant_unique LIKE ? OR adresse_ip LIKE ?)";
    $params[] = "%$search%";
    $params[] = "%$search%";
    $params[] = "%$search%";
}

if ($filter_statut) {
    $where_conditions[] = "statut = ?";
    $params[] = $filter_statut;
}

if ($filter_groupe) {
    $where_conditions[] = "groupe_appareil = ?";
    $params[] = $filter_groupe;
}

$where_clause = $where_conditions ? 'WHERE ' . implode(' AND ', $where_conditions) : '';

// Compter le total
$count_sql = "SELECT COUNT(*) FROM appareils $where_clause";
$stmt = $pdo->prepare($count_sql);
$stmt->execute($params);
$total = $stmt->fetchColumn();

// Récupérer les appareils
$sql = "
    SELECT a.*, p.nom as presentation_defaut_nom
    FROM appareils a
    LEFT JOIN presentations p ON a.presentation_defaut_id = p.id
    $where_clause
    ORDER BY a.derniere_connexion DESC
    LIMIT $limit OFFSET $offset
";
$stmt = $pdo->prepare($sql);
$stmt->execute($params);
$appareils = $stmt->fetchAll();

// Récupérer les présentations pour le select
$presentations = $pdo->query("SELECT id, nom FROM presentations WHERE statut = 'actif' ORDER BY nom")->fetchAll();

// Récupérer les groupes existants
$groupes = $pdo->query("SELECT DISTINCT groupe_appareil FROM appareils WHERE groupe_appareil IS NOT NULL AND groupe_appareil != '' ORDER BY groupe_appareil")->fetchAll(PDO::FETCH_COLUMN);

$total_pages = ceil($total / $limit);
?>
<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Gestion des Appareils - Affichage Dynamique</title>
    
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.2/dist/css/bootstrap.min.css" rel="stylesheet">
    <link href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.1/font/bootstrap-icons.css" rel="stylesheet">
    <link href="assets/css/admin.css" rel="stylesheet">
</head>
<body>
    <!-- Navigation -->
    <nav class="navbar navbar-expand-lg navbar-dark bg-primary">
        <div class="container-fluid">
            <a class="navbar-brand" href="index.php">
                <i class="bi bi-display"></i> Affichage Dynamique
            </a>
            
            <div class="navbar-nav ms-auto">
                <a class="nav-link" href="index.php">
                    <i class="bi bi-house"></i> Tableau de bord
                </a>
            </div>
        </div>
    </nav>

    <div class="container-fluid mt-4">
        <!-- Messages flash -->
        <?php if ($message): ?>
        <div class="alert alert-<?= $message['type'] ?> alert-dismissible fade show flash-message">
            <?= secure($message['text']) ?>
            <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
        </div>
        <?php endif; ?>

        <?php if (isset($error)): ?>
        <div class="alert alert-danger">
            <?= secure($error) ?>
        </div>
        <?php endif; ?>

        <!-- En-tête -->
        <div class="d-flex justify-content-between align-items-center mb-4">
            <h1><i class="bi bi-tv"></i> Gestion des Appareils</h1>
            <div>
                <span class="badge bg-primary fs-6"><?= $total ?> appareil(s)</span>
            </div>
        </div>

        <?php if ($action === 'list'): ?>
        <!-- Filtres -->
        <div class="card mb-4">
            <div class="card-body">
                <form method="GET" class="row g-3">
                    <div class="col-md-4">
                        <label class="form-label">Recherche</label>
                        <input type="text" class="form-control" name="search" value="<?= secure($search) ?>" 
                               placeholder="Nom, ID ou IP...">
                    </div>
                    <div class="col-md-3">
                        <label class="form-label">Statut</label>
                        <select class="form-select" name="filter_statut">
                            <option value="">Tous les statuts</option>
                            <option value="actif" <?= $filter_statut === 'actif' ? 'selected' : '' ?>>Actif</option>
                            <option value="inactif" <?= $filter_statut === 'inactif' ? 'selected' : '' ?>>Inactif</option>
                            <option value="maintenance" <?= $filter_statut === 'maintenance' ? 'selected' : '' ?>>Maintenance</option>
                        </select>
                    </div>
                    <div class="col-md-3">
                        <label class="form-label">Groupe</label>
                        <select class="form-select" name="filter_groupe">
                            <option value="">Tous les groupes</option>
                            <?php foreach ($groupes as $groupe): ?>
                            <option value="<?= secure($groupe) ?>" <?= $filter_groupe === $groupe ? 'selected' : '' ?>>
                                <?= secure($groupe) ?>
                            </option>
                            <?php endforeach; ?>
                        </select>
                    </div>
                    <div class="col-md-2">
                        <label class="form-label">&nbsp;</label>
                        <div class="d-grid">
                            <button type="submit" class="btn btn-primary">
                                <i class="bi bi-search"></i> Filtrer
                            </button>
                        </div>
                    </div>
                </form>
            </div>
        </div>

        <!-- Liste des appareils -->
        <div class="card">
            <div class="card-header">
                <h5 class="card-title mb-0">
                    <i class="bi bi-list"></i> Liste des Appareils
                </h5>
            </div>
            <div class="card-body">
                <div class="table-responsive">
                    <table class="table table-hover">
                        <thead>
                            <tr>
                                <th>Statut</th>
                                <th>Nom</th>
                                <th>Type</th>
                                <th>Identifiant</th>
                                <th>Adresse IP</th>
                                <th>Dernière connexion</th>
                                <th>Présentation par défaut</th>
                                <th>Groupe</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            <?php foreach ($appareils as $appareil): ?>
                            <tr>
                                <td>
                                    <span class="status-icon <?= $appareil['statut'] ?>"></span>
                                    <span class="badge bg-<?= $appareil['statut'] === 'actif' ? 'success' : ($appareil['statut'] === 'maintenance' ? 'warning' : 'danger') ?>">
                                        <?= ucfirst($appareil['statut']) ?>
                                    </span>
                                </td>
                                <td>
                                    <strong><?= secure($appareil['nom']) ?></strong>
                                    <br>
                                    <small class="text-muted"><?= secure($appareil['localisation'] ?? 'Non définie') ?></small>
                                </td>
                                <td>
                                    <i class="bi bi-tv"></i> <?= ucfirst($appareil['type_appareil']) ?>
                                    <br>
                                    <small class="text-muted"><?= secure($appareil['resolution_ecran'] ?? 'N/A') ?></small>
                                </td>
                                <td>
                                    <code><?= secure($appareil['identifiant_unique']) ?></code>
                                    <br>
                                    <small class="text-muted">v<?= secure($appareil['version_app'] ?? 'N/A') ?></small>
                                </td>
                                <td>
                                    <?php if ($appareil['adresse_ip']): ?>
                                    <span class="badge bg-info"><?= secure($appareil['adresse_ip']) ?></span>
                                    <?php else: ?>
                                    <span class="text-muted">Non définie</span>
                                    <?php endif; ?>
                                </td>
                                <td>
                                    <?php 
                                    $derniere_connexion = new DateTime($appareil['derniere_connexion']);
                                    $maintenant = new DateTime();
                                    $diff = $maintenant->diff($derniere_connexion);
                                    
                                    if ($diff->days > 0) {
                                        echo "<span class='text-danger'>Il y a {$diff->days} jour(s)</span>";
                                    } elseif ($diff->h > 0) {
                                        echo "<span class='text-warning'>Il y a {$diff->h}h {$diff->i}min</span>";
                                    } else {
                                        echo "<span class='text-success'>Il y a {$diff->i} min</span>";
                                    }
                                    ?>
                                    <br>
                                    <small class="text-muted"><?= $derniere_connexion->format('d/m/Y H:i') ?></small>
                                </td>
                                <td>
                                    <?php if ($appareil['presentation_defaut_nom']): ?>
                                    <span class="badge bg-primary"><?= secure($appareil['presentation_defaut_nom']) ?></span>
                                    <?php else: ?>
                                    <span class="text-muted">Aucune</span>
                                    <?php endif; ?>
                                </td>
                                <td>
                                    <?php if ($appareil['groupe_appareil']): ?>
                                    <span class="badge bg-secondary"><?= secure($appareil['groupe_appareil']) ?></span>
                                    <?php else: ?>
                                    <span class="text-muted">Aucun</span>
                                    <?php endif; ?>
                                </td>
                                <td>
                                    <div class="btn-group btn-group-sm">
                                        <a href="appareils.php?action=edit&id=<?= $appareil['id'] ?>" 
                                           class="btn btn-outline-primary" title="Modifier">
                                            <i class="bi bi-pencil"></i>
                                        </a>
                                        <button type="button" class="btn btn-outline-danger" 
                                                data-bs-toggle="modal" data-bs-target="#deleteModal<?= $appareil['id'] ?>" 
                                                title="Supprimer">
                                            <i class="bi bi-trash"></i>
                                        </button>
                                    </div>
                                    
                                    <!-- Modal de suppression -->
                                    <div class="modal fade" id="deleteModal<?= $appareil['id'] ?>" tabindex="-1">
                                        <div class="modal-dialog">
                                            <div class="modal-content">
                                                <div class="modal-header">
                                                    <h5 class="modal-title">Confirmer la suppression</h5>
                                                    <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                                                </div>
                                                <div class="modal-body">
                                                    Êtes-vous sûr de vouloir supprimer l'appareil <strong><?= secure($appareil['nom']) ?></strong> ?
                                                    <br><br>
                                                    <div class="alert alert-warning">
                                                        <i class="bi bi-exclamation-triangle"></i>
                                                        Cette action est irréversible et supprimera également toutes les diffusions associées.
                                                    </div>
                                                </div>
                                                <div class="modal-footer">
                                                    <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Annuler</button>
                                                    <form method="POST" style="display: inline;">
                                                        <input type="hidden" name="action" value="delete">
                                                        <input type="hidden" name="id" value="<?= $appareil['id'] ?>">
                                                        <input type="hidden" name="csrf_token" value="<?= generateCSRFToken() ?>">
                                                        <button type="submit" class="btn btn-danger">Supprimer</button>
                                                    </form>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </td>
                            </tr>
                            <?php endforeach; ?>
                        </tbody>
                    </table>
                </div>

                <!-- Pagination -->
                <?php if ($total_pages > 1): ?>
                <nav class="mt-4">
                    <ul class="pagination justify-content-center">
                        <?php for ($i = 1; $i <= $total_pages; $i++): ?>
                        <li class="page-item <?= $i === $page ? 'active' : '' ?>">
                            <a class="page-link" href="?page=<?= $i ?>&search=<?= urlencode($search) ?>&filter_statut=<?= urlencode($filter_statut) ?>&filter_groupe=<?= urlencode($filter_groupe) ?>">
                                <?= $i ?>
                            </a>
                        </li>
                        <?php endfor; ?>
                    </ul>
                </nav>
                <?php endif; ?>
            </div>
        </div>

        <?php elseif ($action === 'edit'): ?>
        <!-- Formulaire d'édition -->
        <div class="row">
            <div class="col-md-8">
                <div class="card">
                    <div class="card-header">
                        <h5 class="card-title mb-0">
                            <i class="bi bi-pencil"></i> Modifier l'Appareil
                        </h5>
                    </div>
                    <div class="card-body">
                        <form method="POST">
                            <input type="hidden" name="action" value="edit">
                            <input type="hidden" name="id" value="<?= $appareil['id'] ?>">
                            <input type="hidden" name="csrf_token" value="<?= generateCSRFToken() ?>">
                            
                            <div class="row">
                                <div class="col-md-6">
                                    <div class="mb-3">
                                        <label class="form-label">Nom de l'appareil</label>
                                        <input type="text" class="form-control" name="nom" 
                                               value="<?= secure($appareil['nom']) ?>" required>
                                    </div>
                                </div>
                                <div class="col-md-6">
                                    <div class="mb-3">
                                        <label class="form-label">Statut</label>
                                        <select class="form-select" name="statut" required>
                                            <option value="actif" <?= $appareil['statut'] === 'actif' ? 'selected' : '' ?>>Actif</option>
                                            <option value="inactif" <?= $appareil['statut'] === 'inactif' ? 'selected' : '' ?>>Inactif</option>
                                            <option value="maintenance" <?= $appareil['statut'] === 'maintenance' ? 'selected' : '' ?>>Maintenance</option>
                                        </select>
                                    </div>
                                </div>
                            </div>
                            
                            <div class="row">
                                <div class="col-md-6">
                                    <div class="mb-3">
                                        <label class="form-label">Localisation</label>
                                        <input type="text" class="form-control" name="localisation" 
                                               value="<?= secure($appareil['localisation'] ?? '') ?>" 
                                               placeholder="Ex: Salon principal, Accueil...">
                                    </div>
                                </div>
                                <div class="col-md-6">
                                    <div class="mb-3">
                                        <label class="form-label">Groupe</label>
                                        <input type="text" class="form-control" name="groupe_appareil" 
                                               value="<?= secure($appareil['groupe_appareil'] ?? '') ?>" 
                                               placeholder="Ex: RDC, Étage 1..." list="groupes-list">
                                        <datalist id="groupes-list">
                                            <?php foreach ($groupes as $groupe): ?>
                                            <option value="<?= secure($groupe) ?>">
                                            <?php endforeach; ?>
                                        </datalist>
                                    </div>
                                </div>
                            </div>
                            
                            <div class="mb-3">
                                <label class="form-label">Présentation par défaut</label>
                                <select class="form-select" name="presentation_defaut_id">
                                    <option value="0">Aucune présentation par défaut</option>
                                    <?php foreach ($presentations as $presentation): ?>
                                    <option value="<?= $presentation['id'] ?>" 
                                            <?= $appareil['presentation_defaut_id'] == $presentation['id'] ? 'selected' : '' ?>>
                                        <?= secure($presentation['nom']) ?>
                                    </option>
                                    <?php endforeach; ?>
                                </select>
                                <div class="form-text">
                                    La présentation par défaut sera affichée automatiquement sur cet appareil s'il n'y a pas de diffusion programmée.
                                </div>
                            </div>
                            
                            <div class="d-flex gap-2">
                                <button type="submit" class="btn btn-primary">
                                    <i class="bi bi-check"></i> Enregistrer
                                </button>
                                <a href="appareils.php" class="btn btn-secondary">
                                    <i class="bi bi-arrow-left"></i> Retour
                                </a>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
            
            <div class="col-md-4">
                <div class="card">
                    <div class="card-header">
                        <h6 class="card-title mb-0">
                            <i class="bi bi-info-circle"></i> Informations techniques
                        </h6>
                    </div>
                    <div class="card-body">
                        <table class="table table-sm">
                            <tr>
                                <td><strong>ID:</strong></td>
                                <td><?= $appareil['id'] ?></td>
                            </tr>
                            <tr>
                                <td><strong>Type:</strong></td>
                                <td><?= ucfirst($appareil['type_appareil']) ?></td>
                            </tr>
                            <tr>
                                <td><strong>Identifiant:</strong></td>
                                <td><code><?= secure($appareil['identifiant_unique']) ?></code></td>
                            </tr>
                            <tr>
                                <td><strong>Adresse IP:</strong></td>
                                <td><?= secure($appareil['adresse_ip'] ?? 'N/A') ?></td>
                            </tr>
                            <tr>
                                <td><strong>Résolution:</strong></td>
                                <td><?= secure($appareil['resolution_ecran'] ?? 'N/A') ?></td>
                            </tr>
                            <tr>
                                <td><strong>Version app:</strong></td>
                                <td><?= secure($appareil['version_app'] ?? 'N/A') ?></td>
                            </tr>
                            <tr>
                                <td><strong>Enregistré le:</strong></td>
                                <td><?= date('d/m/Y H:i', strtotime($appareil['date_enregistrement'])) ?></td>
                            </tr>
                            <tr>
                                <td><strong>Dernière connexion:</strong></td>
                                <td><?= date('d/m/Y H:i', strtotime($appareil['derniere_connexion'])) ?></td>
                            </tr>
                        </table>
                        
                        <?php if ($appareil['capacites']): ?>
                        <h6 class="mt-3">Capacités:</h6>
                        <div class="d-flex flex-wrap gap-1">
                            <?php 
                            $capacites = json_decode($appareil['capacites'], true);
                            foreach ($capacites as $capacite): 
                            ?>
                            <span class="badge bg-info"><?= secure($capacite) ?></span>
                            <?php endforeach; ?>
                        </div>
                        <?php endif; ?>
                    </div>
                </div>
            </div>
        </div>
        <?php endif; ?>
    </div>

    <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.2/dist/js/bootstrap.bundle.min.js"></script>
    <script src="assets/js/admin.js"></script>
</body>
</html>