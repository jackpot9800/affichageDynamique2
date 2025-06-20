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
        redirect('medias.php', 'Token CSRF invalide', 'danger');
    }
    
    switch ($action) {
        case 'upload':
            if (isset($_FILES['fichier']) && $_FILES['fichier']['error'] === UPLOAD_ERR_OK) {
                $nom = trim($_POST['nom']);
                $titre = trim($_POST['titre']);
                $type_media = $_POST['type_media'];
                
                // Valider le fichier
                $errors = validateUploadedFile($_FILES['fichier']);
                
                if (empty($errors)) {
                    try {
                        // Créer le dossier de destination s'il n'existe pas
                        $upload_dir = UPLOAD_PATH . 'medias/';
                        if (!is_dir($upload_dir)) {
                            mkdir($upload_dir, 0755, true);
                        }
                        
                        // Générer un nom de fichier sécurisé
                        $filename = generateSecureFilename($_FILES['fichier']['name']);
                        $filepath = $upload_dir . $filename;
                        
                        // Déplacer le fichier
                        if (move_uploaded_file($_FILES['fichier']['tmp_name'], $filepath)) {
                            // Obtenir les dimensions pour les images
                            $largeur = 0;
                            $hauteur = 0;
                            if (strpos($_FILES['fichier']['type'], 'image/') === 0) {
                                $imageInfo = getimagesize($filepath);
                                if ($imageInfo) {
                                    $largeur = $imageInfo[0];
                                    $hauteur = $imageInfo[1];
                                }
                            }
                            
                            // Insérer en base
                            $stmt = $pdo->prepare("
                                INSERT INTO medias 
                                (nom, titre, type_media, chemin_fichier, taille_fichier, largeur, hauteur, date_creation)
                                VALUES (?, ?, ?, ?, ?, ?, ?, NOW())
                            ");
                            $stmt->execute([
                                $nom,
                                $titre,
                                $type_media,
                                'uploads/medias/' . $filename,
                                $_FILES['fichier']['size'],
                                $largeur,
                                $hauteur
                            ]);
                            
                            $media_id = $pdo->lastInsertId();
                            logAction($pdo, 'maintenance', null, null, null, "Média uploadé: $nom");
                            redirect('medias.php', 'Média uploadé avec succès', 'success');
                        } else {
                            $error = "Erreur lors du déplacement du fichier";
                        }
                    } catch (PDOException $e) {
                        $error = "Erreur lors de l'enregistrement: " . $e->getMessage();
                    }
                } else {
                    $error = implode('<br>', $errors);
                }
            } else {
                $error = "Aucun fichier sélectionné ou erreur d'upload";
            }
            break;
            
        case 'edit':
            $id = (int)$_POST['id'];
            $nom = trim($_POST['nom']);
            $titre = trim($_POST['titre']);
            $type_media = $_POST['type_media'];
            $statut = $_POST['statut'];
            
            try {
                $stmt = $pdo->prepare("
                    UPDATE medias 
                    SET nom = ?, titre = ?, type_media = ?, statut = ?
                    WHERE id = ?
                ");
                $stmt->execute([$nom, $titre, $type_media, $statut, $id]);
                
                logAction($pdo, 'maintenance', null, null, null, "Média modifié: $nom");
                redirect('medias.php', 'Média modifié avec succès', 'success');
            } catch (PDOException $e) {
                $error = "Erreur lors de la modification: " . $e->getMessage();
            }
            break;
            
        case 'delete':
            $id = (int)$_POST['id'];
            try {
                // Récupérer le chemin du fichier avant suppression
                $stmt = $pdo->prepare("SELECT chemin_fichier FROM medias WHERE id = ?");
                $stmt->execute([$id]);
                $media = $stmt->fetch();
                
                if ($media) {
                    // Supprimer le fichier physique
                    $filepath = '../' . $media['chemin_fichier'];
                    if (file_exists($filepath)) {
                        unlink($filepath);
                    }
                    
                    // Supprimer de la base
                    $stmt = $pdo->prepare("DELETE FROM medias WHERE id = ?");
                    $stmt->execute([$id]);
                    
                    logAction($pdo, 'maintenance', null, null, null, "Média supprimé (ID: $id)");
                    redirect('medias.php', 'Média supprimé avec succès', 'success');
                }
            } catch (PDOException $e) {
                $error = "Erreur lors de la suppression: " . $e->getMessage();
            }
            break;
    }
}

// Récupération des données
if ($action === 'edit' && isset($_GET['id'])) {
    $id = (int)$_GET['id'];
    $stmt = $pdo->prepare("SELECT * FROM medias WHERE id = ?");
    $stmt->execute([$id]);
    $media = $stmt->fetch();
    
    if (!$media) {
        redirect('medias.php', 'Média non trouvé', 'danger');
    }
}

// Liste des médias avec pagination
$page = (int)($_GET['page'] ?? 1);
$limit = 20;
$offset = ($page - 1) * $limit;

$search = $_GET['search'] ?? '';
$filter_type = $_GET['filter_type'] ?? '';
$filter_statut = $_GET['filter_statut'] ?? '';

$where_conditions = [];
$params = [];

if ($search) {
    $where_conditions[] = "(nom LIKE ? OR titre LIKE ?)";
    $params[] = "%$search%";
    $params[] = "%$search%";
}

if ($filter_type) {
    $where_conditions[] = "type_media = ?";
    $params[] = $filter_type;
}

if ($filter_statut) {
    $where_conditions[] = "statut = ?";
    $params[] = $filter_statut;
}

$where_clause = $where_conditions ? 'WHERE ' . implode(' AND ', $where_conditions) : '';

// Compter le total
$count_sql = "SELECT COUNT(*) FROM medias $where_clause";
$stmt = $pdo->prepare($count_sql);
$stmt->execute($params);
$total = $stmt->fetchColumn();

// Récupérer les médias
$sql = "
    SELECT m.*,
           COUNT(pm.presentation_id) as utilisations
    FROM medias m
    LEFT JOIN presentation_medias pm ON m.id = pm.media_id
    $where_clause
    GROUP BY m.id
    ORDER BY m.date_creation DESC
    LIMIT $limit OFFSET $offset
";
$stmt = $pdo->prepare($sql);
$stmt->execute($params);
$medias = $stmt->fetchAll();

$total_pages = ceil($total / $limit);
?>
<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Gestion des Médias - Affichage Dynamique</title>
    
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
            <?= $error ?>
        </div>
        <?php endif; ?>

        <!-- En-tête -->
        <div class="d-flex justify-content-between align-items-center mb-4">
            <h1><i class="bi bi-images"></i> Gestion des Médias</h1>
            <div>
                <?php if ($action === 'list'): ?>
                <a href="medias.php?action=upload" class="btn btn-primary">
                    <i class="bi bi-cloud-upload"></i> Uploader un média
                </a>
                <?php endif; ?>
                <span class="badge bg-primary fs-6"><?= $total ?> média(s)</span>
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
                               placeholder="Nom ou titre...">
                    </div>
                    <div class="col-md-3">
                        <label class="form-label">Type</label>
                        <select class="form-select" name="filter_type">
                            <option value="">Tous les types</option>
                            <option value="image" <?= $filter_type === 'image' ? 'selected' : '' ?>>Image</option>
                            <option value="video" <?= $filter_type === 'video' ? 'selected' : '' ?>>Vidéo</option>
                            <option value="html" <?= $filter_type === 'html' ? 'selected' : '' ?>>HTML</option>
                        </select>
                    </div>
                    <div class="col-md-3">
                        <label class="form-label">Statut</label>
                        <select class="form-select" name="filter_statut">
                            <option value="">Tous les statuts</option>
                            <option value="actif" <?= $filter_statut === 'actif' ? 'selected' : '' ?>>Actif</option>
                            <option value="inactif" <?= $filter_statut === 'inactif' ? 'selected' : '' ?>>Inactif</option>
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

        <!-- Grille des médias -->
        <div class="row">
            <?php foreach ($medias as $media): ?>
            <div class="col-md-6 col-lg-4 col-xl-3 mb-4">
                <div class="card h-100">
                    <div class="position-relative">
                        <?php if ($media['type_media'] === 'image'): ?>
                        <img src="../<?= secure($media['chemin_fichier']) ?>" 
                             class="card-img-top" style="height: 200px; object-fit: cover;" 
                             alt="<?= secure($media['nom']) ?>">
                        <?php elseif ($media['type_media'] === 'video'): ?>
                        <div class="card-img-top bg-dark d-flex align-items-center justify-content-center" style="height: 200px;">
                            <i class="bi bi-play-circle text-white" style="font-size: 3rem;"></i>
                        </div>
                        <?php else: ?>
                        <div class="card-img-top bg-info d-flex align-items-center justify-content-center" style="height: 200px;">
                            <i class="bi bi-code-square text-white" style="font-size: 3rem;"></i>
                        </div>
                        <?php endif; ?>
                        
                        <div class="position-absolute top-0 end-0 m-2">
                            <span class="badge bg-<?= $media['statut'] === 'actif' ? 'success' : 'secondary' ?>">
                                <?= ucfirst($media['statut']) ?>
                            </span>
                        </div>
                        
                        <div class="position-absolute top-0 start-0 m-2">
                            <span class="badge bg-primary">
                                <?= ucfirst($media['type_media']) ?>
                            </span>
                        </div>
                    </div>
                    
                    <div class="card-body">
                        <h6 class="card-title"><?= secure($media['nom']) ?></h6>
                        <?php if ($media['titre']): ?>
                        <p class="card-text text-muted small"><?= secure($media['titre']) ?></p>
                        <?php endif; ?>
                        
                        <div class="row text-center small">
                            <div class="col-6">
                                <div class="border-end">
                                    <div class="fw-bold"><?= formatBytes($media['taille_fichier']) ?></div>
                                    <small class="text-muted">Taille</small>
                                </div>
                            </div>
                            <div class="col-6">
                                <div class="fw-bold"><?= $media['utilisations'] ?></div>
                                <small class="text-muted">Utilisations</small>
                            </div>
                        </div>
                        
                        <?php if ($media['largeur'] && $media['hauteur']): ?>
                        <div class="text-center mt-2">
                            <small class="text-muted"><?= $media['largeur'] ?>×<?= $media['hauteur'] ?>px</small>
                        </div>
                        <?php endif; ?>
                    </div>
                    
                    <div class="card-footer">
                        <div class="d-flex gap-1">
                            <a href="medias.php?action=edit&id=<?= $media['id'] ?>" 
                               class="btn btn-outline-primary btn-sm flex-fill">
                                <i class="bi bi-pencil"></i> Modifier
                            </a>
                            <button type="button" class="btn btn-outline-danger btn-sm" 
                                    data-bs-toggle="modal" data-bs-target="#deleteModal<?= $media['id'] ?>">
                                <i class="bi bi-trash"></i>
                            </button>
                        </div>
                    </div>
                </div>
                
                <!-- Modal de suppression -->
                <div class="modal fade" id="deleteModal<?= $media['id'] ?>" tabindex="-1">
                    <div class="modal-dialog">
                        <div class="modal-content">
                            <div class="modal-header">
                                <h5 class="modal-title">Confirmer la suppression</h5>
                                <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                            </div>
                            <div class="modal-body">
                                Êtes-vous sûr de vouloir supprimer le média <strong><?= secure($media['nom']) ?></strong> ?
                                <br><br>
                                <?php if ($media['utilisations'] > 0): ?>
                                <div class="alert alert-warning">
                                    <i class="bi bi-exclamation-triangle"></i>
                                    Ce média est utilisé dans <?= $media['utilisations'] ?> présentation(s). 
                                    Sa suppression affectera ces présentations.
                                </div>
                                <?php endif; ?>
                                <div class="alert alert-danger">
                                    <i class="bi bi-exclamation-triangle"></i>
                                    Le fichier sera définitivement supprimé du serveur.
                                </div>
                            </div>
                            <div class="modal-footer">
                                <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Annuler</button>
                                <form method="POST" style="display: inline;">
                                    <input type="hidden" name="action" value="delete">
                                    <input type="hidden" name="id" value="<?= $media['id'] ?>">
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
                    <a class="page-link" href="?page=<?= $i ?>&search=<?= urlencode($search) ?>&filter_type=<?= urlencode($filter_type) ?>&filter_statut=<?= urlencode($filter_statut) ?>">
                        <?= $i ?>
                    </a>
                </li>
                <?php endfor; ?>
            </ul>
        </nav>
        <?php endif; ?>

        <?php elseif ($action === 'upload'): ?>
        <!-- Formulaire d'upload -->
        <div class="row">
            <div class="col-md-8">
                <div class="card">
                    <div class="card-header">
                        <h5 class="card-title mb-0">
                            <i class="bi bi-cloud-upload"></i> Uploader un Média
                        </h5>
                    </div>
                    <div class="card-body">
                        <form method="POST" enctype="multipart/form-data">
                            <input type="hidden" name="action" value="upload">
                            <input type="hidden" name="csrf_token" value="<?= generateCSRFToken() ?>">
                            
                            <div class="mb-4">
                                <label class="form-label">Fichier</label>
                                <div class="drop-zone">
                                    <input type="file" class="form-control" name="fichier" 
                                           accept="image/*,video/*,.html" required style="display: none;">
                                    <i class="bi bi-cloud-upload"></i>
                                    <p class="mb-2">Cliquez pour sélectionner ou glissez-déposez votre fichier</p>
                                    <small class="text-muted">
                                        Formats supportés: JPG, PNG, GIF, MP4, HTML<br>
                                        Taille maximum: <?= formatBytes(MAX_FILE_SIZE) ?>
                                    </small>
                                    <div class="file-preview mt-3" style="display: none;">
                                        <img src="" alt="Prévisualisation" style="max-width: 200px; max-height: 150px;">
                                    </div>
                                    <div class="file-info mt-2">
                                        <div class="file-name"></div>
                                        <div class="file-size text-muted"></div>
                                    </div>
                                </div>
                            </div>
                            
                            <div class="row">
                                <div class="col-md-6">
                                    <div class="mb-3">
                                        <label class="form-label">Nom du média</label>
                                        <input type="text" class="form-control" name="nom" required 
                                               placeholder="Ex: Logo entreprise">
                                    </div>
                                </div>
                                <div class="col-md-6">
                                    <div class="mb-3">
                                        <label class="form-label">Type de média</label>
                                        <select class="form-select" name="type_media" required>
                                            <option value="image">Image</option>
                                            <option value="video">Vidéo</option>
                                            <option value="html">HTML</option>
                                        </select>
                                    </div>
                                </div>
                            </div>
                            
                            <div class="mb-3">
                                <label class="form-label">Titre (optionnel)</label>
                                <input type="text" class="form-control" name="titre" 
                                       placeholder="Titre affiché avec le média">
                            </div>
                            
                            <div class="d-flex gap-2">
                                <button type="submit" class="btn btn-primary">
                                    <i class="bi bi-cloud-upload"></i> Uploader
                                </button>
                                <a href="medias.php" class="btn btn-secondary">
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
                            <i class="bi bi-info-circle"></i> Conseils d'upload
                        </h6>
                    </div>
                    <div class="card-body">
                        <h6>Images</h6>
                        <ul class="small">
                            <li>Résolution recommandée: 1920×1080px</li>
                            <li>Formats: JPG, PNG, GIF</li>
                            <li>Optimisez vos images pour le web</li>
                        </ul>
                        
                        <h6>Vidéos</h6>
                        <ul class="small">
                            <li>Format recommandé: MP4 (H.264)</li>
                            <li>Résolution max: 1920×1080px</li>
                            <li>Durée recommandée: moins de 2 minutes</li>
                        </ul>
                        
                        <h6>HTML</h6>
                        <ul class="small">
                            <li>Contenu web interactif</li>
                            <li>CSS et JS intégrés</li>
                            <li>Responsive design recommandé</li>
                        </ul>
                    </div>
                </div>
            </div>
        </div>

        <?php elseif ($action === 'edit'): ?>
        <!-- Formulaire d'édition -->
        <div class="row">
            <div class="col-md-8">
                <div class="card">
                    <div class="card-header">
                        <h5 class="card-title mb-0">
                            <i class="bi bi-pencil"></i> Modifier le Média
                        </h5>
                    </div>
                    <div class="card-body">
                        <form method="POST">
                            <input type="hidden" name="action" value="edit">
                            <input type="hidden" name="id" value="<?= $media['id'] ?>">
                            <input type="hidden" name="csrf_token" value="<?= generateCSRFToken() ?>">
                            
                            <div class="row">
                                <div class="col-md-6">
                                    <div class="mb-3">
                                        <label class="form-label">Nom du média</label>
                                        <input type="text" class="form-control" name="nom" 
                                               value="<?= secure($media['nom']) ?>" required>
                                    </div>
                                </div>
                                <div class="col-md-6">
                                    <div class="mb-3">
                                        <label class="form-label">Type de média</label>
                                        <select class="form-select" name="type_media" required>
                                            <option value="image" <?= $media['type_media'] === 'image' ? 'selected' : '' ?>>Image</option>
                                            <option value="video" <?= $media['type_media'] === 'video' ? 'selected' : '' ?>>Vidéo</option>
                                            <option value="html" <?= $media['type_media'] === 'html' ? 'selected' : '' ?>>HTML</option>
                                        </select>
                                    </div>
                                </div>
                            </div>
                            
                            <div class="mb-3">
                                <label class="form-label">Titre</label>
                                <input type="text" class="form-control" name="titre" 
                                       value="<?= secure($media['titre']) ?>">
                            </div>
                            
                            <div class="mb-3">
                                <label class="form-label">Statut</label>
                                <select class="form-select" name="statut" required>
                                    <option value="actif" <?= $media['statut'] === 'actif' ? 'selected' : '' ?>>Actif</option>
                                    <option value="inactif" <?= $media['statut'] === 'inactif' ? 'selected' : '' ?>>Inactif</option>
                                </select>
                            </div>
                            
                            <div class="d-flex gap-2">
                                <button type="submit" class="btn btn-primary">
                                    <i class="bi bi-check"></i> Enregistrer
                                </button>
                                <a href="medias.php" class="btn btn-secondary">
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
                            <i class="bi bi-info-circle"></i> Aperçu du média
                        </h6>
                    </div>
                    <div class="card-body text-center">
                        <?php if ($media['type_media'] === 'image'): ?>
                        <img src="../<?= secure($media['chemin_fichier']) ?>" 
                             class="img-fluid rounded" alt="<?= secure($media['nom']) ?>"
                             style="max-height: 200px;">
                        <?php elseif ($media['type_media'] === 'video'): ?>
                        <video controls class="img-fluid rounded" style="max-height: 200px;">
                            <source src="../<?= secure($media['chemin_fichier']) ?>" type="video/mp4">
                            Votre navigateur ne supporte pas la lecture vidéo.
                        </video>
                        <?php else: ?>
                        <div class="bg-info rounded d-flex align-items-center justify-content-center" style="height: 200px;">
                            <i class="bi bi-code-square text-white" style="font-size: 3rem;"></i>
                        </div>
                        <?php endif; ?>
                        
                        <table class="table table-sm mt-3">
                            <tr>
                                <td><strong>Fichier:</strong></td>
                                <td><?= basename($media['chemin_fichier']) ?></td>
                            </tr>
                            <tr>
                                <td><strong>Taille:</strong></td>
                                <td><?= formatBytes($media['taille_fichier']) ?></td>
                            </tr>
                            <?php if ($media['largeur'] && $media['hauteur']): ?>
                            <tr>
                                <td><strong>Dimensions:</strong></td>
                                <td><?= $media['largeur'] ?>×<?= $media['hauteur'] ?>px</td>
                            </tr>
                            <?php endif; ?>
                            <tr>
                                <td><strong>Créé le:</strong></td>
                                <td><?= date('d/m/Y H:i', strtotime($media['date_creation'])) ?></td>
                            </tr>
                        </table>
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