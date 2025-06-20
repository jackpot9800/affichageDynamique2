/**
 * JavaScript pour l'interface d'administration
 * PHP 8.2 - Bootstrap 5.3 - Affichage Dynamique
 */

document.addEventListener('DOMContentLoaded', function() {
    // Initialisation des tooltips Bootstrap
    const tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'));
    tooltipTriggerList.map(function (tooltipTriggerEl) {
        return new bootstrap.Tooltip(tooltipTriggerEl);
    });

    // Initialisation des popovers Bootstrap
    const popoverTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="popover"]'));
    popoverTriggerList.map(function (popoverTriggerEl) {
        return new bootstrap.Popover(popoverTriggerEl);
    });

    // Auto-hide des messages flash
    const flashMessages = document.querySelectorAll('.flash-message');
    flashMessages.forEach(function(message) {
        setTimeout(function() {
            const alert = new bootstrap.Alert(message);
            alert.close();
        }, 5000);
    });

    // Confirmation de suppression
    const deleteButtons = document.querySelectorAll('[data-confirm-delete]');
    deleteButtons.forEach(function(button) {
        button.addEventListener('click', function(e) {
            e.preventDefault();
            const message = this.getAttribute('data-confirm-delete') || 'Êtes-vous sûr de vouloir supprimer cet élément ?';
            
            if (confirm(message)) {
                // Si c'est un lien, suivre le lien
                if (this.tagName === 'A') {
                    window.location.href = this.href;
                }
                // Si c'est un bouton dans un formulaire, soumettre le formulaire
                else if (this.form) {
                    this.form.submit();
                }
            }
        });
    });

    // Drag and drop pour l'upload de fichiers
    const dropZones = document.querySelectorAll('.drop-zone');
    dropZones.forEach(function(dropZone) {
        const fileInput = dropZone.querySelector('input[type="file"]');
        
        if (fileInput) {
            // Événements de drag and drop
            dropZone.addEventListener('dragover', function(e) {
                e.preventDefault();
                this.classList.add('dragover');
            });

            dropZone.addEventListener('dragleave', function(e) {
                e.preventDefault();
                this.classList.remove('dragover');
            });

            dropZone.addEventListener('drop', function(e) {
                e.preventDefault();
                this.classList.remove('dragover');
                
                const files = e.dataTransfer.files;
                if (files.length > 0) {
                    fileInput.files = files;
                    handleFileSelect(files[0], this);
                }
            });

            // Clic sur la zone pour ouvrir le sélecteur
            dropZone.addEventListener('click', function() {
                fileInput.click();
            });

            // Changement de fichier via le sélecteur
            fileInput.addEventListener('change', function() {
                if (this.files.length > 0) {
                    handleFileSelect(this.files[0], dropZone);
                }
            });
        }
    });

    // Gestion de la sélection de fichier
    function handleFileSelect(file, dropZone) {
        const preview = dropZone.querySelector('.file-preview');
        const fileName = dropZone.querySelector('.file-name');
        const fileSize = dropZone.querySelector('.file-size');

        if (fileName) {
            fileName.textContent = file.name;
        }

        if (fileSize) {
            fileSize.textContent = formatFileSize(file.size);
        }

        // Prévisualisation pour les images
        if (file.type.startsWith('image/') && preview) {
            const reader = new FileReader();
            reader.onload = function(e) {
                preview.src = e.target.result;
                preview.style.display = 'block';
            };
            reader.readAsDataURL(file);
        }
    }

    // Formatage de la taille de fichier
    function formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    // Recherche en temps réel
    const searchInputs = document.querySelectorAll('[data-search-table]');
    searchInputs.forEach(function(input) {
        const tableId = input.getAttribute('data-search-table');
        const table = document.getElementById(tableId);
        
        if (table) {
            input.addEventListener('input', function() {
                const searchTerm = this.value.toLowerCase();
                const rows = table.querySelectorAll('tbody tr');
                
                rows.forEach(function(row) {
                    const text = row.textContent.toLowerCase();
                    row.style.display = text.includes(searchTerm) ? '' : 'none';
                });
            });
        }
    });

    // Auto-refresh des données
    const autoRefreshElements = document.querySelectorAll('[data-auto-refresh]');
    autoRefreshElements.forEach(function(element) {
        const interval = parseInt(element.getAttribute('data-auto-refresh')) * 1000;
        const url = element.getAttribute('data-refresh-url');
        
        if (url && interval > 0) {
            setInterval(function() {
                fetch(url)
                    .then(response => response.text())
                    .then(html => {
                        element.innerHTML = html;
                    })
                    .catch(error => {
                        console.error('Erreur lors du rafraîchissement:', error);
                    });
            }, interval);
        }
    });

    // Gestion des formulaires AJAX
    const ajaxForms = document.querySelectorAll('[data-ajax-form]');
    ajaxForms.forEach(function(form) {
        form.addEventListener('submit', function(e) {
            e.preventDefault();
            
            const formData = new FormData(this);
            const submitButton = this.querySelector('[type="submit"]');
            const originalText = submitButton.textContent;
            
            // Désactiver le bouton et afficher un spinner
            submitButton.disabled = true;
            submitButton.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>Traitement...';
            
            fetch(this.action, {
                method: this.method,
                body: formData
            })
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    showAlert(data.message || 'Opération réussie', 'success');
                    if (data.redirect) {
                        setTimeout(() => {
                            window.location.href = data.redirect;
                        }, 1000);
                    }
                } else {
                    showAlert(data.message || 'Une erreur est survenue', 'danger');
                }
            })
            .catch(error => {
                console.error('Erreur:', error);
                showAlert('Une erreur est survenue', 'danger');
            })
            .finally(() => {
                // Réactiver le bouton
                submitButton.disabled = false;
                submitButton.textContent = originalText;
            });
        });
    });

    // Affichage d'alertes dynamiques
    function showAlert(message, type = 'info') {
        const alertContainer = document.getElementById('alert-container') || createAlertContainer();
        
        const alertElement = document.createElement('div');
        alertElement.className = `alert alert-${type} alert-dismissible fade show flash-message`;
        alertElement.innerHTML = `
            ${message}
            <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
        `;
        
        alertContainer.appendChild(alertElement);
        
        // Auto-suppression après 5 secondes
        setTimeout(() => {
            const alert = new bootstrap.Alert(alertElement);
            alert.close();
        }, 5000);
    }

    // Création du conteneur d'alertes s'il n'existe pas
    function createAlertContainer() {
        const container = document.createElement('div');
        container.id = 'alert-container';
        container.style.position = 'fixed';
        container.style.top = '20px';
        container.style.right = '20px';
        container.style.zIndex = '1050';
        container.style.minWidth = '300px';
        document.body.appendChild(container);
        return container;
    }

    // Gestion des modales de confirmation
    const confirmModals = document.querySelectorAll('[data-confirm-modal]');
    confirmModals.forEach(function(trigger) {
        trigger.addEventListener('click', function(e) {
            e.preventDefault();
            
            const modalId = this.getAttribute('data-confirm-modal');
            const modal = document.getElementById(modalId);
            
            if (modal) {
                const confirmButton = modal.querySelector('.btn-confirm');
                const action = this.href || this.getAttribute('data-action');
                
                if (confirmButton && action) {
                    confirmButton.onclick = function() {
                        window.location.href = action;
                    };
                }
                
                const bootstrapModal = new bootstrap.Modal(modal);
                bootstrapModal.show();
            }
        });
    });

    // Mise à jour automatique de l'heure
    const timeElements = document.querySelectorAll('[data-live-time]');
    if (timeElements.length > 0) {
        setInterval(function() {
            const now = new Date();
            timeElements.forEach(function(element) {
                const format = element.getAttribute('data-live-time');
                if (format === 'time') {
                    element.textContent = now.toLocaleTimeString('fr-FR');
                } else if (format === 'datetime') {
                    element.textContent = now.toLocaleString('fr-FR');
                }
            });
        }, 1000);
    }

    // Sauvegarde automatique des brouillons
    const draftForms = document.querySelectorAll('[data-auto-save]');
    draftForms.forEach(function(form) {
        const inputs = form.querySelectorAll('input, textarea, select');
        const formId = form.id || 'form_' + Math.random().toString(36).substr(2, 9);
        
        // Charger les données sauvegardées
        loadDraft(formId, inputs);
        
        // Sauvegarder à chaque modification
        inputs.forEach(function(input) {
            input.addEventListener('input', function() {
                saveDraft(formId, inputs);
            });
        });
    });

    function saveDraft(formId, inputs) {
        const data = {};
        inputs.forEach(function(input) {
            if (input.name) {
                data[input.name] = input.value;
            }
        });
        localStorage.setItem('draft_' + formId, JSON.stringify(data));
    }

    function loadDraft(formId, inputs) {
        const saved = localStorage.getItem('draft_' + formId);
        if (saved) {
            try {
                const data = JSON.parse(saved);
                inputs.forEach(function(input) {
                    if (input.name && data[input.name]) {
                        input.value = data[input.name];
                    }
                });
            } catch (e) {
                console.error('Erreur lors du chargement du brouillon:', e);
            }
        }
    }
});

// Fonctions utilitaires globales
window.AdminUtils = {
    // Copier du texte dans le presse-papiers
    copyToClipboard: function(text) {
        navigator.clipboard.writeText(text).then(function() {
            showAlert('Copié dans le presse-papiers', 'success');
        }).catch(function(err) {
            console.error('Erreur lors de la copie:', err);
        });
    },
    
    // Confirmer une action
    confirm: function(message, callback) {
        if (confirm(message)) {
            callback();
        }
    },
    
    // Recharger une section de la page
    reloadSection: function(sectionId, url) {
        const section = document.getElementById(sectionId);
        if (section) {
            fetch(url)
                .then(response => response.text())
                .then(html => {
                    section.innerHTML = html;
                })
                .catch(error => {
                    console.error('Erreur lors du rechargement:', error);
                });
        }
    }
};