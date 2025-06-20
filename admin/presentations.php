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
        redirect('presentations.php', 'Token CSRF invalide', 'danger');
    }
    
    switch ($action) {
        case 'create':
            $nom = trim($_POST['nom']);
            $description = trim($_POST['description']);
            $statut = $_POST['statut'];
            
            try {
                $stmt = $pdo->prepare("
                    INSERT INTO presentations (nom, description, statut, date_creation)
                    VALUES (?, ?, ?, NOW())
                ");
                $stmt->execute([$nom, $description, $statut]);
                
                $presentation_id = $pdo->lastInsertId();
                logAction($pdo, 'maintenance', null, null, $presentation_id, "Présentation créée: $nom");
                redirect("presentations.php?action=edit&id=$presentation_id", 'Présentation créée avec succès', 'success');
            } catch (PDOException $e) {
                $error = "Erreur lors de la création: " . $e->getMessage();
            }
            break;
            
        case 'edit':
            $id = (int)$_POST['id'];
            $nom = trim($_POST['nom']);
            $description = trim($_POST['description']);
            $statut = $_POST['statut'];
            
            try {
                $stmt = $pdo->prepare("
                    UPDATE presentations 
                    SET nom = ?, description = ?, statut = ?, date_modification = NOW()
                    WHERE id = ?
                ");
                $stmt->execute([$nom, $description, $statut, $id]);
                
                logAction($pdo, 'maintenance', null, null, $id, "Présentation modifiée: $nom");
                redirect('presentations.php', 'Présentation modifiée avec succès', 'success');
            } catch (PDOException $e) {
                $error = "Erreur lors de la modification: " . $e->getMessage();
            }
            break;
            
        case 'delete':
            $id = (int)$_POST['id'];
            try {
                $stmt = $pdo->prepare("DELETE FROM presentations WHERE id = ?");
                $stmt->execute([$id]);
                
                logAction($pdo, 'maintenance', null, null, null, "Présentation supprimée (ID: $id)");
                redirect('presentations.php', 'Présentation supprimée avec succès', 'success');
            } catch (PDOException $e) {
                $error = "Erreur lors de la suppression: " . $e->getMessage();
            }
            break;
            
        case 'update_medias':
            $presentation_id = (int)$_POST['presentation_id'];
            $medias_data = $_POST['medias'] ?? [];
            
            try {
                $pdo->beginTransaction();
                
                // Supprimer les anciennes associations
                $stmt = $pdo->prepare("DELETE FROM presentation_medias WHERE presentation_id = ?");
                $stmt->execute([$presentation_id]);
                
                // Ajouter les nouvelles associations
                $stmt = $pdo->prepare("
                    INSERT INTO presentation_medias 
                    (presentation_id, media_id, ordre_affichage, duree_affichage, effet_transition)
                    VALUES (?, ?, ?, ?, ?)
                ");
                
                $duree_totale = 0;
                foreach ($medias_data as $ordre => $media_data) {
                    $media_id = (int)$media_data['media_id'];
                    $duree = (int)$media_data['duree'];
                    $transition = $media_data['transition'];
                    
                    $stmt->execute([$presentation_id, $media_id, $ordre + 1, $duree, $transition]);
                    $duree_totale += $duree;
                }
                
                // Mettre à jour les statistiques de la présentation
                $stmt = $pdo->prepare("
                    UPDATE presentations 
                    SET nombre_slides = ?, duree_totale = ?, date_modification = NOW()
                    WHERE id = ?
                ");
                $stmt->execute([count($medias_data), $duree_totale, $presentation_id]);
                
                $pdo->commit();
                logAction($pdo, 'maintenance', null, null, $presentation_id, "Médias de présentation mis à jour");
                redirect("presentations.php?action=edit&id=$presentation_id", 'Médias mis à jour avec succès', 'success');
            } catch (PDOException $e) {
                $pdo->rollBack();
                $error = "Erreur lors de la mise à jour: " . $e->getMessage();
            }
            break;
    }
}

// Récupération des données
if ($action === 'edit' && isset($_GET['id'])) {
    $id = (int)$_GET['id'];
    $stmt = $pdo->prepare("SELECT * FROM presentations WHERE id = ?");
    $stmt->execute([$id]);
    $presentation = $stmt->fetch();
    
    if (!$presentation) {
        redirect('presentations.php', 'Présentation non trouvée', 'danger');
    }
    
    // Récupérer les médias associés
    $stmt = $pdo->prepare("
        SELECT pm.*, m.nom as media_nom, m.type_media, m.chemin_fichier
        FROM presentation_medias pm
        JOIN medias m ON pm.media_id = m.id
        WHERE pm.presentation_id = ?
        ORDER BY pm.ordre_affichage
    ");
    $stmt->execute([$id]);
    $medias_associes = $stmt->fetchAll();
}

// Liste des présentations avec pagination
$page = (int)($_GET['page'] ?? 1);
$limit = 20;
$offset = ($page - 1) * $limit;

$search = $_GET['search'] ?? '';
$filter_statut = $_GET['filter_statut'] ?? '';

$where_conditions = [];
$params = [];

if ($search) {
    $where_conditions[] = "(nom LIKE ? OR description LIKE ?)";
    $params[] = "%$search%";
    $params[] = "%$search%";
}

if ($filter_statut) {
    $where_conditions[] = "statut = ?";
    $params[] = $filter_statut;
}

$where_clause = $where_conditions ? 'WHERE ' . implode(' AND ', $where_conditions) : '';

// Compter le total
$count_sql = "SELECT COUNT(*) FROM presentations $where_clause";
$stmt = $pdo->prepare($count_sql);
$stmt->execute($params);
$total = $stmt->fetchColumn();

// Récupérer les présentations
$sql = "
    SELECT p.*, 
           COUNT(pm.media_id) as nombre_medias,
           SUM(pm.duree_affichage) as duree_calculee
    FROM presentations p
    LEFT JOIN presentation_medias pm ON p.id = pm.presentation_id
    $where_clause
    GROUP BY p.id
    ORDER BY p.date_creation DESC
    LIMIT $limit OFFSET $offset
";
$stmt = $pdo->prepare($sql);
$stmt->execute($params);
$presentations = $stmt->fetchAll();

// Récupérer tous les médias pour les selects
$medias_disponibles = $pdo->query("
    SELECT id, nom, type_media, chemin_fichier 
    FROM medias 
    WHERE statut = 'actif' 
    ORDER BY nom
")->fetchAll();

$total_pages = ceil($total / $limit);
?>
<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Gestion des Présentations - Affichage Dynamique</title>
    
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.2/dist/css/bootstrap.min.css" rel="stylesheet">
    <link href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.1/font/bootstrap-icons.css" rel="stylesheet">
    <link href="https://cdn.jsdelivr.net/npm/sortablejs@1.15.0/Sortable.min.css" rel="stylesheet">
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
            <h1><i class="bi bi-collection-play"></i> Gestion des Présentations</h1>
            <div>
                <?php if ($action === 'list'): ?>
                <a href="presentations.php?action=create" class="btn btn-primary">
                    <i class="bi bi-plus-circle"></i> Nouvelle présentation
                </a>
                <?php endif; ?>
                <span class="badge bg-primary fs-6"><?= $total ?> présentation(s)</span>
            </div>
        </div>

        <?php if ($action === 'list'): ?>
        <!-- Filtres -->
        <div class="card mb-4">
            <div class="card-body">
                <form method="GET" class="row g-3">
                    <div class="col-md-6">
                        <label class="form-label">Recherche</label>
                        <input type="text" class="form-control" name="search" value="<?= secure($search) ?>" 
                               placeholder="Nom ou description...">
                    </div>
                    <div class="col-md-4">
                        <label class="form-label">Statut</label>
                        <select class="form-select" name="filter_statut">
                            <option value="">Tous les statuts</option>
                            <option value="actif" <?= $filter_statut === 'actif' ? 'selected' : '' ?>>Actif</option>
                            <option value="inactif" <?= $filter_statut === 'inactif' ? 'selected' : '' ?>>Inactif</option>
                            <option value="brouillon" <?= $filter_statut === 'brouillon' ? 'selected' : '' ?>>Brouillon</option>
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

        <!-- Liste des présentations -->
        <div class="row">
            <?php foreach ($presentations as $presentation): ?>
            <div class="col-md-6 col-lg-4 mb-4">
                <div class="card h-100">
                    <div class="card-header d-flex justify-content-between align-items-center">
                        <span class="badge bg-<?= $presentation['statut'] === 'actif' ? 'success' : ($presentation['statut'] === 'brouillon' ? 'warning' : 'secondary') ?>">
                            <?= ucfirst($presentation['statut']) ?>
                        </span>
                        <div class="dropdown">
                            <button class="btn btn-sm btn-outline-secondary" type="button" data-bs-toggle="dropdown">
                                <i class="bi bi-three-dots"></i>
                            </button>
                            <ul class="dropdown-menu">
                                <li><a class="dropdown-item" href="presentations.php?action=edit&id=<?= $presentation['id'] ?>">
                                    <i class="bi bi-pencil"></i> Modifier
                                </a></li>
                                <li><a class="dropdown-item" href="diffusions.php?presentation_id=<?= $presentation['id'] ?>">
                                    <i class="bi bi-broadcast"></i> Programmer diffusion
                                </a></li>
                                <li><hr class="dropdown-divider"></li>
                                <li><a class="dropdown-item text-danger" href="#" 
                                       data-bs-toggle="modal" data-bs-target="#deleteModal<?= $presentation['id'] ?>">
                                    <i class="bi bi-trash"></i> Supprimer
                                </a></li>
                            </ul>
                        </div>
                    </div>
                    <div class="card-body">
                        <h5 class="card-title"><?= secure($presentation['nom']) ?></h5>
                        <p class="card-text text-muted">
                            <?= secure(substr($presentation['description'], 0, 100)) ?>
                            <?= strlen($presentation['description']) > 100 ? '...' : '' ?>
                        </p>
                        
                        <div class="row text-center">
                            <div class="col-4">
                                <div class="border-end">
                                    <div class="h5 mb-0"><?= $presentation['nombre_medias'] ?></div>
                                    <small class="text-muted">Médias</small>
                                </div>
                            </div>
                            <div class="col-4">
                                <div class="border-end">
                                    <div class="h5 mb-0">
                                        <?= $presentation['duree_calculee'] ? gmdate('i:s', $presentation['duree_calculee']) : '0:00' ?>
                                    </div>
                                    <small class="text-muted">Durée</small>
                                </div>
                            </div>
                            <div class="col-4">
                                <div class="h5 mb-0">
                                    <?php
                                    $date_creation = new DateTime($presentation['date_creation']);
                                    echo $date_creation->format('d/m');
                                    ?>
                                </div>
                                <small class="text-muted">Créée</small>
                            </div>
                        </div>
                    </div>
                    <div class="card-footer">
                        <div class="d-flex gap-2">
                            <a href="presentations.php?action=edit&id=<?= $presentation['id'] ?>" 
                               class="btn btn-primary btn-sm flex-fill">
                                <i class="bi bi-pencil"></i> Modifier
                            </a>
                            <a href="#" class="btn btn-outline-success btn-sm" title="Prévisualiser">
                                <i class="bi bi-eye"></i>
                            </a>
                        </div>
                    </div>
                </div>
                
                <!-- Modal de suppression -->
                <div class="modal fade" id="deleteModal<?= $presentation['id'] ?>" tabindex="-1">
                    <div class="modal-dialog">
                        <div class="modal-content">
                            <div class="modal-header">
                                <h5 class="modal-title">Confirmer la suppression</h5>
                                <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                            </div>
                            <div class="modal-body">
                                Êtes-vous sûr de vouloir supprimer la présentation <strong><?= secure($presentation['nom']) ?></strong> ?
                                <br><br>
                                <div class="alert alert-warning">
                                    <i class="bi bi-exclamation-triangle"></i>
                                    Cette action supprimera également toutes les diffusions programmées pour cette présentation.
                                </div>
                            </div>
                            <div class="modal-footer">
                                <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Annuler</button>
                                <form method="POST" style="display: inline;">
                                    <input type="hidden" name="action" value="delete">
                                    <input type="hidden" name="id" value="<?= $presentation['id'] ?>">
                                    <input type="hidden" name="csrf_token" value="<?= generateCSRFToken() ?>">
                                    <button type="submit" class="btn btn-danger">Supprimer</button>
                                </form>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            <?php endforeach; ?>
        </div>

        <!-- Pagination -->
        <?php if ($total_pages > 1): ?>
        <nav class="mt-4">
            <ul class="pagination justify-content-center">
                <?php for ($i = 1; $i <= $total_pages; $i++): ?>
                <li class="page-item <?= $i === $page ? 'active' : '' ?>">
                    <a class="page-link" href="?page=<?= $i ?>&search=<?= urlencode($search) ?>&filter_statut=<?= urlencode($filter_statut) ?>">
                        <?= $i ?>
                    </a>
                </li>
                <?php endfor; ?>
            </ul>
        </nav>
        <?php endif; ?>

        <?php elseif ($action === 'create'): ?>
        <!-- Formulaire de création -->
        <div class="row">
            <div class="col-md-8">
                <div class="card">
                    <div class="card-header">
                        <h5 class="card-title mb-0">
                            <i class="bi bi-plus-circle"></i> Nouvelle Présentation
                        </h5>
                    </div>
                    <div class="card-body">
                        <form method="POST">
                            <input type="hidden" name="action" value="create">
                            <input type="hidden" name="csrf_token" value="<?= generateCSRFToken() ?>">
                            
                            <div class="mb-3">
                                <label class="form-label">Nom de la présentation</label>
                                <input type="text" class="form-control" name="nom" required 
                                       placeholder="Ex: Présentation accueil client">
                            </div>
                            
                            <div class="mb-3">
                                <label class="form-label">Description</label>
                                <textarea class="form-control" name="description" rows="3" 
                                          placeholder="Description de la présentation..."></textarea>
                            </div>
                            
                            <div class="mb-3">
                                <label class="form-label">Statut</label>
                                <select class="form-select" name="statut" required>
                                    <option value="brouillon">Brouillon</option>
                                    <option value="actif">Actif</option>
                                    <option value="inactif">Inactif</option>
                                </select>
                                <div class="form-text">
                                    Les présentations en brouillon ne sont pas visibles par les appareils.
                                </div>
                            </div>
                            
                            <div class="d-flex gap-2">
                                <button type="submit" class="btn btn-primary">
                                    <i class="bi bi-check"></i> Créer la présentation
                                </button>
                                <a href="presentations.php" class="btn btn-secondary">
                                    <i class="bi bi-arrow-left"></i> Retour
                                </a>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        </div>

        <?php elseif ($action === 'edit'): ?>
        <!-- Formulaire d'édition -->
        <div class="row">
            <div class="col-md-8">
                <div class="card mb-4">
                    <div class="card-header">
                        <h5 class="card-title mb-0">
                            <i class="bi bi-pencil"></i> Modifier la Présentation
                        </h5>
                    </div>
                    <div class="card-body">
                        <form method="POST">
                            <input type="hidden" name="action" value="edit">
                            <input type="hidden" name="id" value="<?= $presentation['id'] ?>">
                            <input type="hidden" name="csrf_token" value="<?= generateCSRFToken() ?>">
                            
                            <div class="mb-3">
                                <label class="form-label">Nom de la présentation</label>
                                <input type="text" class="form-control" name="nom" 
                                       value="<?= secure($presentation['nom']) ?>" required>
                            </div>
                            
                            <div class="mb-3">
                                <label class="form-label">Description</label>
                                <textarea class="form-control" name="description" rows="3"><?= secure($presentation['description']) ?></textarea>
                            </div>
                            
                            <div class="mb-3">
                                <label class="form-label">Statut</label>
                                <select class="form-select" name="statut" required>
                                    <option value="brouillon" <?= $presentation['statut'] === 'brouillon' ? 'selected' : '' ?>>Brouillon</option>
                                    <option value="actif" <?= $presentation['statut'] === 'actif' ? 'selected' : '' ?>>Actif</option>
                                    <option value="inactif" <?= $presentation['statut'] === 'inactif' ? 'selected' : '' ?>>Inactif</option>
                                </select>
                            </div>
                            
                            <div class="d-flex gap-2">
                                <button type="submit" class="btn btn-primary">
                                    <i class="bi bi-check"></i> Enregistrer
                                </button>
                                <a href="presentations.php" class="btn btn-secondary">
                                    <i class="bi bi-arrow-left"></i> Retour
                                </a>
                            </div>
                        </form>
                    </div>
                </div>

                <!-- Gestion des médias -->
                <div class="card">
                    <div class="card-header">
                        <h5 class="card-title mb-0">
                            <i class="bi bi-images"></i> Médias de la présentation
                        </h5>
                    </div>
                    <div class="card-body">
                        <form method="POST" id="medias-form">
                            <input type="hidden" name="action" value="update_medias">
                            <input type="hidden" name="presentation_id" value="<?= $presentation['id'] ?>">
                            <input type="hidden" name="csrf_token" value="<?= generateCSRFToken() ?>">
                            
                            <div id="medias-container">
                                <?php foreach ($medias_associes as $index => $media): ?>
                                <div class="media-item border rounded p-3 mb-3" data-index="<?= $index ?>">
                                    <div class="d-flex align-items-center mb-2">
                                        <i class="bi bi-grip-vertical text-muted me-2" style="cursor: move;"></i>
                                        <strong>Média <?= $index + 1 ?></strong>
                                        <button type="button" class="btn btn-sm btn-outline-danger ms-auto remove-media">
                                            <i class="bi bi-trash"></i>
                                        </button>
                                    </div>
                                    
                                    <div class="row">
                                        <div class="col-md-6">
                                            <label class="form-label">Média</label>
                                            <select class="form-select" name="medias[<?= $index ?>][media_id]" required>
                                                <?php foreach ($medias_disponibles as $media_dispo): ?>
                                                <option value="<?= $media_dispo['id'] ?>" 
                                                        <?= $media['media_id'] == $media_dispo['id'] ? 'selected' : '' ?>>
                                                    <?= secure($media_dispo['nom']) ?> (<?= $media_dispo['type_media'] ?>)
                                                </option>
                                                <?php endforeach; ?>
                                            </select>
                                        </div>
                                        <div class="col-md-3">
                                            <label class="form-label">Durée (secondes)</label>
                                            <input type="number" class="form-control" 
                                                   name="medias[<?= $index ?>][duree]" 
                                                   value="<?= $media['duree_affichage'] ?>" 
                                                   min="1" max="300" required>
                                        </div>
                                        <div class="col-md-3">
                                            <label class="form-label">Transition</label>
                                            <select class="form-select" name="medias[<?= $index ?>][transition]">
                                                <option value="fade" <?= $media['effet_transition'] === 'fade' ? 'selected' : '' ?>>Fondu</option>
                                                <option value="slide" <?= $media['effet_transition'] === 'slide' ? 'selected' : '' ?>>Glissement</option>
                                                <option value="none" <?= $media['effet_transition'] === 'none' ? 'selected' : '' ?>>Aucune</option>
                                            </select>
                                        </div>
                                    </div>
                                </div>
                                <?php endforeach; ?>
                            </div>
                            
                            <div class="d-flex gap-2 mb-3">
                                <button type="button" class="btn btn-outline-primary" id="add-media">
                                    <i class="bi bi-plus"></i> Ajouter un média
                                </button>
                                <button type="submit" class="btn btn-success">
                                    <i class="bi bi-check"></i> Enregistrer les médias
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
            
            <div class="col-md-4">
                <div class="card">
                    <div class="card-header">
                        <h6 class="card-title mb-0">
                            <i class="bi bi-info-circle"></i> Informations
                        </h6>
                    </div>
                    <div class="card-body">
                        <table class="table table-sm">
                            <tr>
                                <td><strong>ID:</strong></td>
                                <td><?= $presentation['id'] ?></td>
                            </tr>
                            <tr>
                                <td><strong>Statut:</strong></td>
                                <td>
                                    <span class="badge bg-<?= $presentation['statut'] === 'actif' ? 'success' : ($presentation['statut'] === 'brouillon' ? 'warning' : 'secondary') ?>">
                                        <?= ucfirst($presentation['statut']) ?>
                                    </span>
                                </td>
                            </tr>
                            <tr>
                                <td><strong>Créée le:</strong></td>
                                <td><?= date('d/m/Y H:i', strtotime($presentation['date_creation'])) ?></td>
                            </tr>
                            <tr>
                                <td><strong>Modifiée le:</strong></td>
                                <td><?= date('d/m/Y H:i', strtotime($presentation['date_modification'])) ?></td>
                            </tr>
                            <tr>
                                <td><strong>Nombre de médias:</strong></td>
                                <td><?= $presentation['nombre_slides'] ?></td>
                            </tr>
                            <tr>
                                <td><strong>Durée totale:</strong></td>
                                <td><?= $presentation['duree_totale'] ? gmdate('i:s', $presentation['duree_totale']) : '0:00' ?></td>
                            </tr>
                        </table>
                    </div>
                </div>
                
                <div class="card mt-3">
                    <div class="card-header">
                        <h6 class="card-title mb-0">
                            <i class="bi bi-broadcast"></i> Actions rapides
                        </h6>
                    </div>
                    <div class="card-body">
                        <div class="d-grid gap-2">
                            <a href="diffusions.php?presentation_id=<?= $presentation['id'] ?>" 
                               class="btn btn-outline-primary">
                                <i class="bi bi-broadcast"></i> Programmer diffusion
                            </a>
                            <a href="medias.php?action=upload" class="btn btn-outline-success">
                                <i class="bi bi-cloud-upload"></i> Ajouter des médias
                            </a>
                            <a href="#" class="btn btn-outline-info">
                                <i class="bi bi-eye"></i> Prévisualiser
                            </a>
                        </div>
                    </div>
                </div>
            </div>
        </div>
        <?php endif; ?>
    </div>

    <!-- Template pour nouveau média -->
    <template id="media-template">
        <div class="media-item border rounded p-3 mb-3" data-index="">
            <div class="d-flex align-items-center mb-2">
                <i class="bi bi-grip-vertical text-muted me-2" style="cursor: move;"></i>
                <strong>Média <span class="media-number"></span></strong>
                <button type="button" class="btn btn-sm btn-outline-danger ms-auto remove-media">
                    <i class="bi bi-trash"></i>
                </button>
            </div>
            
            <div class="row">
                <div class="col-md-6">
                    <label class="form-label">Média</label>
                    <select class="form-select media-select" name="" required>
                        <option value="">Sélectionner un média...</option>
                        <?php foreach ($medias_disponibles as $media_dispo): ?>
                        <option value="<?= $media_dispo['id'] ?>">
                            <?= secure($media_dispo['nom']) ?> (<?= $media_dispo['type_media'] ?>)
                        </option>
                        <?php endforeach; ?>
                    </select>
                </div>
                <div class="col-md-3">
                    <label class="form-label">Durée (secondes)</label>
                    <input type="number" class="form-control duree-input" name="" 
                           value="5" min="1" max="300" required>
                </div>
                <div class="col-md-3">
                    <label class="form-label">Transition</label>
                    <select class="form-select transition-select" name="">
                        <option value="fade">Fondu</option>
                        <option value="slide">Glissement</option>
                        <option value="none">Aucune</option>
                    </select>
                </div>
            </div>
        </div>
    </template>

    <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.2/dist/js/bootstrap.bundle.min.js"></script>
    <script src="https://cdn.jsdelivr.net/npm/sortablejs@1.15.0/Sortable.min.js"></script>
    <script src="assets/js/admin.js"></script>
    
    <script>
    document.addEventListener('DOMContentLoaded', function() {
        const mediasContainer = document.getElementById('medias-container');
        const addMediaBtn = document.getElementById('add-media');
        const mediaTemplate = document.getElementById('media-template');
        
        if (mediasContainer && addMediaBtn && mediaTemplate) {
            // Rendre la liste triable
            new Sortable(mediasContainer, {
                handle: '.bi-grip-vertical',
                animation: 150,
                onEnd: function() {
                    updateMediaIndexes();
                }
            });
            
            // Ajouter un nouveau média
            addMediaBtn.addEventListener('click', function() {
                const index = mediasContainer.children.length;
                const template = mediaTemplate.content.cloneNode(true);
                
                // Mettre à jour les attributs
                const mediaItem = template.querySelector('.media-item');
                mediaItem.setAttribute('data-index', index);
                
                const mediaNumber = template.querySelector('.media-number');
                mediaNumber.textContent = index + 1;
                
                const mediaSelect = template.querySelector('.media-select');
                mediaSelect.name = `medias[${index}][media_id]`;
                
                const dureeInput = template.querySelector('.duree-input');
                dureeInput.name = `medias[${index}][duree]`;
                
                const transitionSelect = template.querySelector('.transition-select');
                transitionSelect.name = `medias[${index}][transition]`;
                
                mediasContainer.appendChild(template);
                updateMediaIndexes();
            });
            
            // Supprimer un média
            mediasContainer.addEventListener('click', function(e) {
                if (e.target.closest('.remove-media')) {
                    e.target.closest('.media-item').remove();
                    updateMediaIndexes();
                }
            });
            
            function updateMediaIndexes() {
                const mediaItems = mediasContainer.querySelectorAll('.media-item');
                mediaItems.forEach((item, index) => {
                    item.setAttribute('data-index', index);
                    
                    const mediaNumber = item.querySelector('.media-number');
                    if (mediaNumber) {
                        mediaNumber.textContent = index + 1;
                    }
                    
                    const mediaSelect = item.querySelector('.media-select');
                    if (mediaSelect) {
                        mediaSelect.name = `medias[${index}][media_id]`;
                    }
                    
                    const dureeInput = item.querySelector('.duree-input');
                    if (dureeInput) {
                        dureeInput.name = `medias[${index}][duree]`;
                    }
                    
                    const transitionSelect = item.querySelector('.transition-select');
                    if (transitionSelect) {
                        transitionSelect.name = `medias[${index}][transition]`;
                    }
                });
            }
        }
    });
    </script>
</body>
</html>