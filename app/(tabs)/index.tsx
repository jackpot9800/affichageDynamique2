import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Alert,
  Dimensions,
  Platform,
} from 'react-native';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Monitor, Wifi, WifiOff, RefreshCw, Play, Settings, Repeat, Star } from 'lucide-react-native';
import { apiService, Presentation, AssignedPresentation, DefaultPresentation } from '@/services/ApiService';

const { width } = Dimensions.get('window');

export default function HomeScreen() {
  const [presentations, setPresentations] = useState<Presentation[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'connected' | 'disconnected' | 'testing' | 'not_configured'>('testing');
  const [assignedPresentation, setAssignedPresentation] = useState<AssignedPresentation | null>(null);
  const [defaultPresentation, setDefaultPresentation] = useState<DefaultPresentation | null>(null);
  const [assignmentCheckStarted, setAssignmentCheckStarted] = useState(false);
  const [defaultCheckStarted, setDefaultCheckStarted] = useState(false);
  const [focusedIndex, setFocusedIndex] = useState(0);
  const [showDefaultPresentationPrompt, setShowDefaultPresentationPrompt] = useState(false);
  const [autoLaunchDefaultTimer, setAutoLaunchDefaultTimer] = useState<NodeJS.Timeout | null>(null);

  useEffect(() => {
    initializeApp();
  }, []);

  // Nettoyage du timer au démontage du composant
  useEffect(() => {
    return () => {
      if (autoLaunchDefaultTimer) {
        clearTimeout(autoLaunchDefaultTimer);
      }
    };
  }, [autoLaunchDefaultTimer]);

  const initializeApp = async () => {
    setLoading(true);
    await apiService.initialize();
    
    const serverUrl = apiService.getServerUrl();
    console.log('Current server URL:', serverUrl);
    
    if (!serverUrl) {
      setConnectionStatus('not_configured');
      setLoading(false);
      return;
    }
    
    await checkConnection();
    await loadPresentations();
    
    if (apiService.isDeviceRegistered() && connectionStatus === 'connected') {
      console.log('=== DEVICE IS REGISTERED AND CONNECTED, STARTING CHECKS ===');
      startAssignmentMonitoring();
      startDefaultPresentationMonitoring();
    } else {
      console.log('=== DEVICE NOT READY FOR CHECKS ===');
      console.log('Registered:', apiService.isDeviceRegistered());
      console.log('Connection status:', connectionStatus);
      
      setTimeout(async () => {
        if (apiService.isDeviceRegistered()) {
          console.log('=== DEVICE NOW REGISTERED, STARTING CHECKS ===');
          await startAssignmentMonitoring();
          await startDefaultPresentationMonitoring();
        }
      }, 3000);
    }
    
    setLoading(false);
  };

  const checkConnection = async () => {
    const serverUrl = apiService.getServerUrl();
    if (!serverUrl) {
      setConnectionStatus('not_configured');
      return;
    }
    
    setConnectionStatus('testing');
    try {
      console.log('Testing connection to:', serverUrl);
      const isConnected = await apiService.testConnection();
      console.log('Connection test result:', isConnected);
      setConnectionStatus(isConnected ? 'connected' : 'disconnected');
    } catch (error) {
      console.error('Connection test error:', error);
      setConnectionStatus('disconnected');
    }
  };

  const loadPresentations = async () => {
    const serverUrl = apiService.getServerUrl();
    if (!serverUrl) {
      setConnectionStatus('not_configured');
      return;
    }
    
    try {
      console.log('Loading presentations from:', serverUrl);
      const data = await apiService.getPresentations();
      console.log('Presentations loaded:', data.length);
      setPresentations(data);
    } catch (error) {
      console.error('Error loading presentations:', error);
      // Afficher l'erreur à l'utilisateur
      Alert.alert(
        'Erreur de connexion',
        `Impossible de charger les présentations:\n\n${error instanceof Error ? error.message : 'Erreur inconnue'}`,
        [
          { text: 'Paramètres', onPress: () => router.push('/(tabs)/settings') },
          { text: 'Réessayer', onPress: loadPresentations },
        ]
      );
    }
  };

  const startAssignmentMonitoring = async () => {
    if (assignmentCheckStarted) {
      console.log('Assignment check already started');
      return;
    }

    console.log('=== STARTING ASSIGNMENT MONITORING ===');
    setAssignmentCheckStarted(true);
    
    try {
      await apiService.startAssignmentCheck((assigned: AssignedPresentation) => {
        console.log('=== ASSIGNED PRESENTATION DETECTED ===');
        console.log('Presentation ID:', assigned.presentation_id);
        console.log('Auto play:', assigned.auto_play);
        console.log('Loop mode:', assigned.loop_mode);
        console.log('Presentation name:', assigned.presentation_name);
        
        setAssignedPresentation(assigned);
        
        // CORRECTION: Lancement automatique IMMÉDIAT pour les présentations assignées
        console.log('=== AUTO-LAUNCHING ASSIGNED PRESENTATION IMMEDIATELY ===');
        
        // Annuler le timer de présentation par défaut si actif
        if (autoLaunchDefaultTimer) {
          clearTimeout(autoLaunchDefaultTimer);
          setAutoLaunchDefaultTimer(null);
        }
        
        // Masquer la notification de présentation par défaut
        setShowDefaultPresentationPrompt(false);
        
        // Lancer immédiatement la présentation assignée en mode boucle
        setTimeout(() => {
          launchAssignedPresentation(assigned);
        }, 1000); // Délai minimal pour permettre l'affichage de l'interface
      });

      console.log('=== CHECKING FOR EXISTING ASSIGNMENT ===');
      const existing = await apiService.checkForAssignedPresentation();
      if (existing) {
        console.log('=== FOUND EXISTING ASSIGNMENT ===', existing);
        setAssignedPresentation(existing);
        
        // CORRECTION: Lancement automatique immédiat pour les assignations existantes
        console.log('=== AUTO-LAUNCHING EXISTING ASSIGNED PRESENTATION ===');
        
        // Annuler le timer de présentation par défaut si actif
        if (autoLaunchDefaultTimer) {
          clearTimeout(autoLaunchDefaultTimer);
          setAutoLaunchDefaultTimer(null);
        }
        
        // Masquer la notification de présentation par défaut
        setShowDefaultPresentationPrompt(false);
        
        // Lancer immédiatement
        setTimeout(() => {
          launchAssignedPresentation(existing);
        }, 2000); // Délai légèrement plus long pour l'assignation existante
      }
    } catch (error) {
      console.log('=== ASSIGNMENT MONITORING FAILED ===');
      console.log('Error:', error);
      
      if (error instanceof Error && error.message.includes('Endpoint not found')) {
        console.log('⚠️ Assignment features not available on this server version');
        setAssignmentCheckStarted(false);
      } else {
        console.error('Unexpected error starting assignment monitoring:', error);
        setAssignmentCheckStarted(false);
      }
    }
  };

  const startDefaultPresentationMonitoring = async () => {
    if (defaultCheckStarted) {
      console.log('Default presentation check already started');
      return;
    }

    console.log('=== STARTING DEFAULT PRESENTATION MONITORING ===');
    setDefaultCheckStarted(true);
    
    try {
      await apiService.startDefaultPresentationCheck((defaultPres: DefaultPresentation) => {
        console.log('=== DEFAULT PRESENTATION DETECTED ===');
        console.log('Presentation ID:', defaultPres.presentation_id);
        console.log('Presentation name:', defaultPres.presentation_name);
        
        setDefaultPresentation(defaultPres);
        
        // Ne pas afficher la notification si une présentation assignée est active
        if (!assignedPresentation) {
          // Afficher une notification discrète
          setShowDefaultPresentationPrompt(true);
          
          // Masquer automatiquement après 10 secondes
          setTimeout(() => {
            setShowDefaultPresentationPrompt(false);
          }, 10000);

          // Auto-lancement après 30 secondes si aucune interaction
          const timer = setTimeout(() => {
            console.log('=== AUTO-LAUNCHING DEFAULT PRESENTATION AFTER TIMEOUT ===');
            launchDefaultPresentation(defaultPres);
          }, 30000);
          
          setAutoLaunchDefaultTimer(timer);
        }
      });

      console.log('=== CHECKING FOR EXISTING DEFAULT PRESENTATION ===');
      const existing = await apiService.checkForDefaultPresentation();
      if (existing) {
        console.log('=== FOUND EXISTING DEFAULT PRESENTATION ===', existing);
        setDefaultPresentation(existing);
        
        // Ne pas afficher la notification si une présentation assignée est active
        if (!assignedPresentation) {
          // Afficher immédiatement la notification pour la présentation par défaut existante
          setShowDefaultPresentationPrompt(true);
          
          // Auto-lancement après 30 secondes
          const timer = setTimeout(() => {
            console.log('=== AUTO-LAUNCHING EXISTING DEFAULT PRESENTATION ===');
            launchDefaultPresentation(existing);
          }, 30000);
          
          setAutoLaunchDefaultTimer(timer);
        }
      }
    } catch (error) {
      console.log('=== DEFAULT PRESENTATION MONITORING FAILED ===');
      console.log('Error:', error);
      
      if (error instanceof Error && error.message.includes('Endpoint not found')) {
        console.log('⚠️ Default presentation features not available on this server version');
        setDefaultCheckStarted(false);
      } else {
        console.error('Unexpected error starting default presentation monitoring:', error);
        setDefaultCheckStarted(false);
      }
    }
  };

  const launchAssignedPresentation = (assigned: AssignedPresentation) => {
    console.log('=== LAUNCHING ASSIGNED PRESENTATION ===');
    console.log('Presentation ID:', assigned.presentation_id);
    console.log('Auto play:', assigned.auto_play);
    console.log('Loop mode:', assigned.loop_mode);
    
    // Annuler le timer de présentation par défaut si actif
    if (autoLaunchDefaultTimer) {
      clearTimeout(autoLaunchDefaultTimer);
      setAutoLaunchDefaultTimer(null);
    }
    
    apiService.markAssignedPresentationAsViewed(assigned.presentation_id);
    
    // CORRECTION: Forcer auto_play et loop_mode à true pour les présentations assignées
    const params = new URLSearchParams({
      auto_play: 'true', // Toujours true pour les assignations
      loop_mode: 'true', // Toujours true pour les assignations
      assigned: 'true'
    });
    
    const url = `/presentation/${assigned.presentation_id}?${params.toString()}`;
    console.log('Navigating to:', url);
    
    router.push(url);
  };

  const launchDefaultPresentation = (defaultPres: DefaultPresentation) => {
    console.log('=== LAUNCHING DEFAULT PRESENTATION ===');
    console.log('Presentation ID:', defaultPres.presentation_id);
    
    // Annuler le timer si actif
    if (autoLaunchDefaultTimer) {
      clearTimeout(autoLaunchDefaultTimer);
      setAutoLaunchDefaultTimer(null);
    }
    
    // Masquer la notification
    setShowDefaultPresentationPrompt(false);
    
    const params = new URLSearchParams({
      auto_play: 'true',
      loop_mode: 'true',
      assigned: 'false',
      default: 'true'
    });
    
    const url = `/presentation/${defaultPres.presentation_id}?${params.toString()}`;
    console.log('Navigating to:', url);
    
    router.push(url);
  };

  const cancelDefaultAutoLaunch = () => {
    if (autoLaunchDefaultTimer) {
      clearTimeout(autoLaunchDefaultTimer);
      setAutoLaunchDefaultTimer(null);
    }
    setShowDefaultPresentationPrompt(false);
  };

  // Fonction de rafraîchissement manuel
  const handleManualRefresh = async () => {
    setRefreshing(true);
    await checkConnection();
    await loadPresentations();
    
    if (apiService.isDeviceRegistered() && assignmentCheckStarted) {
      console.log('=== REFRESHING ASSIGNMENT CHECK ===');
      try {
        await apiService.checkForAssignedPresentation();
      } catch (error) {
        console.log('Assignment refresh failed (normal if endpoint not available):', error);
      }
    }

    if (apiService.isDeviceRegistered() && defaultCheckStarted) {
      console.log('=== REFRESHING DEFAULT PRESENTATION CHECK ===');
      try {
        await apiService.checkForDefaultPresentation();
      } catch (error) {
        console.log('Default presentation refresh failed (normal if endpoint not available):', error);
      }
    }
    
    setRefreshing(false);
  };

  const onRefresh = async () => {
    await handleManualRefresh();
  };

  // Lancer une présentation avec mode boucle automatique
  const playPresentation = (presentation: Presentation) => {
    // Annuler le timer de présentation par défaut si actif
    if (autoLaunchDefaultTimer) {
      clearTimeout(autoLaunchDefaultTimer);
      setAutoLaunchDefaultTimer(null);
    }
    
    // Lancer automatiquement en mode boucle
    const params = new URLSearchParams({
      auto_play: 'true',
      loop_mode: 'true',
      assigned: 'false'
    });
    
    const url = `/presentation/${presentation.id}?${params.toString()}`;
    console.log('Launching presentation with auto-loop:', url);
    
    router.push(url);
  };

  const goToSettings = () => {
    router.push('/(tabs)/settings');
  };

  const renderConnectionStatus = () => {
    const statusConfig = {
      connected: { color: '#10b981', text: 'Connecté au serveur', icon: Wifi },
      disconnected: { color: '#ef4444', text: 'Serveur inaccessible', icon: WifiOff },
      testing: { color: '#f59e0b', text: 'Test de connexion...', icon: RefreshCw },
      not_configured: { color: '#6b7280', text: 'Serveur non configuré', icon: WifiOff },
    };

    const config = statusConfig[connectionStatus];
    const IconComponent = config.icon;

    return (
      <TouchableOpacity 
        style={[
          styles.statusCard, 
          { borderLeftColor: config.color },
          focusedIndex === -1 && styles.focusedCard
        ]}
        onPress={goToSettings}
        accessible={true}
        accessibilityLabel={`Statut de connexion: ${config.text}. Appuyez pour aller aux paramètres.`}
        accessibilityRole="button"
        onFocus={() => setFocusedIndex(-1)}
      >
        <View style={styles.statusHeader}>
          <IconComponent size={20} color={config.color} />
          <Text style={[styles.statusText, { color: config.color }]}>
            {config.text}
          </Text>
          <Settings size={16} color="#9ca3af" />
        </View>
        <Text style={styles.serverUrl}>
          {apiService.getServerUrl() || 'Cliquez pour configurer'}
        </Text>
        {connectionStatus === 'not_configured' && (
          <Text style={styles.configHint}>
            Configurez l'URL de votre serveur pour commencer
          </Text>
        )}
        {assignmentCheckStarted && (
          <Text style={styles.assignmentStatus}>
            ✓ Surveillance des assignations active
          </Text>
        )}
        {defaultCheckStarted && (
          <Text style={styles.assignmentStatus}>
            ✓ Surveillance des présentations par défaut active
          </Text>
        )}
      </TouchableOpacity>
    );
  };

  const renderAssignedPresentation = () => {
    if (!assignedPresentation) return null;

    return (
      <View style={styles.assignedSection}>
        <Text style={styles.assignedTitle}>📌 Présentation assignée</Text>
        <TouchableOpacity
          style={[
            styles.assignedCard,
            focusedIndex === -2 && styles.focusedCard
          ]}
          onPress={() => launchAssignedPresentation(assignedPresentation)}
          activeOpacity={0.8}
          accessible={true}
          accessibilityLabel={`Présentation assignée: ${assignedPresentation.presentation_name}. Appuyez pour lancer.`}
          accessibilityRole="button"
          onFocus={() => setFocusedIndex(-2)}
        >
          <LinearGradient
            colors={['#f59e0b', '#d97706']}
            style={styles.assignedGradient}
          >
            <View style={styles.assignedHeader}>
              <Monitor size={24} color="#ffffff" />
              <View style={styles.assignedBadges}>
                <View style={styles.autoPlayBadge}>
                  <Play size={12} color="#ffffff" />
                  <Text style={styles.badgeText}>AUTO</Text>
                </View>
                <View style={styles.loopBadge}>
                  <Repeat size={12} color="#ffffff" />
                  <Text style={styles.badgeText}>BOUCLE</Text>
                </View>
              </View>
            </View>
            
            <Text style={styles.assignedName} numberOfLines={2}>
              {assignedPresentation.presentation_name}
            </Text>
            <Text style={styles.assignedDescription} numberOfLines={2}>
              {assignedPresentation.presentation_description || 'Présentation assignée à cet appareil'}
            </Text>
            
            <View style={styles.assignedFooter}>
              <Text style={styles.assignedMode}>
                🚀 Lecture automatique en boucle
              </Text>
              <View style={styles.assignedPlayButton}>
                <Play size={18} color="#ffffff" fill="#ffffff" />
              </View>
            </View>
          </LinearGradient>
        </TouchableOpacity>
      </View>
    );
  };

  const renderDefaultPresentation = () => {
    if (!defaultPresentation) return null;

    return (
      <View style={styles.assignedSection}>
        <Text style={styles.assignedTitle}>⭐ Présentation par défaut</Text>
        <TouchableOpacity
          style={[
            styles.assignedCard,
            focusedIndex === 0 && styles.focusedCard
          ]}
          onPress={() => launchDefaultPresentation(defaultPresentation)}
          activeOpacity={0.8}
          accessible={true}
          accessibilityLabel={`Présentation par défaut: ${defaultPresentation.presentation_name}. Appuyez pour lancer.`}
          accessibilityRole="button"
          onFocus={() => setFocusedIndex(0)}
        >
          <LinearGradient
            colors={['#8b5cf6', '#7c3aed']}
            style={styles.assignedGradient}
          >
            <View style={styles.assignedHeader}>
              <Star size={24} color="#ffffff" />
              <View style={styles.assignedBadges}>
                <View style={styles.defaultBadge}>
                  <Star size={12} color="#ffffff" />
                  <Text style={styles.badgeText}>DÉFAUT</Text>
                </View>
              </View>
            </View>
            
            <Text style={styles.assignedName} numberOfLines={2}>
              {defaultPresentation.presentation_name}
            </Text>
            <Text style={styles.assignedDescription} numberOfLines={2}>
              {defaultPresentation.presentation_description || 'Présentation par défaut pour cet appareil'}
            </Text>
            
            <View style={styles.assignedFooter}>
              <Text style={styles.assignedMode}>
                🌟 Cliquez pour lancer
              </Text>
              <View style={styles.assignedPlayButton}>
                <Play size={18} color="#ffffff" fill="#ffffff" />
              </View>
            </View>
          </LinearGradient>
        </TouchableOpacity>
      </View>
    );
  };

  const renderDefaultPresentationPrompt = () => {
    if (!showDefaultPresentationPrompt || !defaultPresentation) return null;

    return (
      <View style={styles.promptOverlay}>
        <View style={styles.promptCard}>
          <LinearGradient
            colors={['#8b5cf6', '#7c3aed']}
            style={styles.promptGradient}
          >
            <View style={styles.promptHeader}>
              <Star size={20} color="#ffffff" />
              <Text style={styles.promptTitle}>Présentation par défaut disponible</Text>
              <TouchableOpacity
                style={styles.promptCloseButton}
                onPress={cancelDefaultAutoLaunch}
              >
                <Text style={styles.promptCloseText}>×</Text>
              </TouchableOpacity>
            </View>
            
            <Text style={styles.promptMessage}>
              "{defaultPresentation.presentation_name}" va se lancer automatiquement dans 30 secondes
            </Text>
            
            <View style={styles.promptActions}>
              <TouchableOpacity
                style={styles.promptButton}
                onPress={() => launchDefaultPresentation(defaultPresentation)}
              >
                <Play size={16} color="#ffffff" />
                <Text style={styles.promptButtonText}>Lancer maintenant</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.promptButton, styles.promptCancelButton]}
                onPress={cancelDefaultAutoLaunch}
              >
                <Text style={styles.promptButtonText}>Annuler</Text>
              </TouchableOpacity>
            </View>
          </LinearGradient>
        </View>
      </View>
    );
  };

  const renderPresentationCard = (presentation: Presentation, index: number) => {
    const gradientColors = [
      ['#667eea', '#764ba2'],
      ['#f093fb', '#f5576c'],
      ['#4facfe', '#00f2fe'],
      ['#43e97b', '#38f9d7']
    ];
    
    const colors = gradientColors[index % gradientColors.length];
    const adjustedIndex = index + (defaultPresentation ? 1 : 0);
    const isFocused = focusedIndex === adjustedIndex;

    return (
      <TouchableOpacity
        key={presentation.id}
        style={[
          styles.presentationCard,
          isFocused && styles.focusedCard
        ]}
        onPress={() => playPresentation(presentation)}
        activeOpacity={0.8}
        accessible={true}
        accessibilityLabel={`Présentation: ${presentation.name}. ${presentation.slide_count} slides. Appuyez pour lancer en mode boucle automatique.`}
        accessibilityRole="button"
        onFocus={() => setFocusedIndex(adjustedIndex)}
      >
        <LinearGradient
          colors={colors}
          style={styles.cardGradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <View style={styles.cardHeader}>
            <Monitor size={28} color="#ffffff" />
            <View style={styles.slideCountBadge}>
              <Text style={styles.slideCountText}>{presentation.slide_count}</Text>
            </View>
          </View>
          
          <View style={styles.cardContent}>
            <Text style={styles.presentationTitle} numberOfLines={2}>
              {presentation.name}
            </Text>
            <Text style={styles.presentationDescription} numberOfLines={3}>
              {presentation.description || 'Aucune description disponible'}
            </Text>
            
            {/* Indicateur de lecture automatique en boucle */}
            <View style={styles.autoLoopIndicator}>
              <Repeat size={14} color="rgba(255, 255, 255, 0.9)" />
              <Text style={styles.autoLoopText}>Lecture automatique en boucle</Text>
            </View>
          </View>

          <View style={styles.cardFooter}>
            <Text style={styles.createdDate}>
              {new Date(presentation.created_at).toLocaleDateString('fr-FR')}
            </Text>
            <View style={[styles.playButton, isFocused && styles.focusedPlayButton]}>
              <Play size={18} color="#ffffff" fill="#ffffff" />
            </View>
          </View>
        </LinearGradient>
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <LinearGradient
          colors={['#667eea', '#764ba2']}
          style={styles.loadingGradient}
        >
          <RefreshCw size={48} color="#ffffff" />
          <Text style={styles.loadingText}>Initialisation de l'application...</Text>
          <Text style={styles.loadingSubtext}>Vérification des assignations...</Text>
        </LinearGradient>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        showsVerticalScrollIndicator={false}
      >
        <LinearGradient
          colors={['#667eea', '#764ba2']}
          style={styles.headerGradient}
        >
          <View style={styles.header}>
            <View style={styles.headerContent}>
              <Text style={styles.title}>Kiosque de Présentations</Text>
              <Text style={styles.subtitle}>
                Fire TV Stick - Serveur Enhanced
              </Text>
              
              <View style={styles.headerButtons}>
                {/* Bouton de rafraîchissement dans l'en-tête */}
                <TouchableOpacity
                  style={[
                    styles.refreshButton,
                    focusedIndex === -3 && styles.focusedRefreshButton
                  ]}
                  onPress={handleManualRefresh}
                  disabled={refreshing}
                  accessible={true}
                  accessibilityLabel="Rafraîchir les données"
                  accessibilityRole="button"
                  onFocus={() => setFocusedIndex(-3)}
                >
                  <RefreshCw 
                    size={20} 
                    color="#ffffff" 
                    style={refreshing ? styles.spinning : undefined}
                  />
                  <Text style={styles.refreshButtonText}>
                    {refreshing ? 'Actualisation...' : 'Actualiser'}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </LinearGradient>

        {renderConnectionStatus()}
        {renderAssignedPresentation()}
        {renderDefaultPresentation()}

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>
              Présentations disponibles ({presentations.length})
            </Text>
            <Text style={styles.sectionSubtitle}>
              🔄 Lecture automatique en boucle activée
            </Text>
          </View>
          
          {connectionStatus === 'not_configured' ? (
            <View style={styles.configurationNeeded}>
              <Settings size={64} color="#6b7280" />
              <Text style={styles.configTitle}>Configuration requise</Text>
              <Text style={styles.configMessage}>
                Configurez l'URL de votre serveur pour accéder aux présentations
              </Text>
              <TouchableOpacity
                style={styles.configButton}
                onPress={goToSettings}
                accessible={true}
                accessibilityLabel="Configurer le serveur"
                accessibilityRole="button"
              >
                <Settings size={20} color="#ffffff" />
                <Text style={styles.configButtonText}>Configurer le serveur</Text>
              </TouchableOpacity>
            </View>
          ) : connectionStatus === 'disconnected' ? (
            <View style={styles.disconnectedState}>
              <WifiOff size={64} color="#ef4444" />
              <Text style={styles.disconnectedTitle}>Connexion impossible</Text>
              <Text style={styles.disconnectedMessage}>
                Impossible de se connecter au serveur. Vérifiez:
                {'\n'}• L'URL du serveur dans les paramètres
                {'\n'}• Que le serveur est accessible
                {'\n'}• Votre connexion réseau
              </Text>
              <View style={styles.actionButtons}>
                <TouchableOpacity
                  style={styles.retryButton}
                  onPress={handleManualRefresh}
                  accessible={true}
                  accessibilityLabel="Réessayer la connexion"
                  accessibilityRole="button"
                >
                  <RefreshCw size={20} color="#ffffff" />
                  <Text style={styles.retryButtonText}>Réessayer</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.settingsButton}
                  onPress={goToSettings}
                  accessible={true}
                  accessibilityLabel="Aller aux paramètres"
                  accessibilityRole="button"
                >
                  <Settings size={20} color="#ffffff" />
                  <Text style={styles.settingsButtonText}>Paramètres</Text>
                </TouchableOpacity>
              </View>
            </View>
          ) : presentations.length === 0 ? (
            <View style={styles.emptyState}>
              <Monitor size={64} color="#6b7280" />
              <Text style={styles.emptyTitle}>Aucune présentation</Text>
              <Text style={styles.emptyMessage}>
                Aucune présentation disponible sur le serveur.
                {'\n'}Créez des présentations depuis votre interface web.
              </Text>
              <TouchableOpacity
                style={styles.refreshButton}
                onPress={handleManualRefresh}
                accessible={true}
                accessibilityLabel="Actualiser la liste"
                accessibilityRole="button"
              >
                <RefreshCw size={20} color="#ffffff" />
                <Text style={styles.refreshButtonText}>Actualiser</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.presentationsGrid}>
              {presentations.map((presentation, index) => 
                renderPresentationCard(presentation, index)
              )}
            </View>
          )}
        </View>

        <View style={styles.infoSection}>
          <LinearGradient
            colors={['#43e97b', '#38f9d7']}
            style={styles.infoCard}
          >
            <Monitor size={32} color="#ffffff" />
            <Text style={styles.infoTitle}>Application Enhanced</Text>
            <Text style={styles.infoText}>
              Cette application se connecte à votre serveur de présentations.
              {'\n'}Serveur: {apiService.getServerUrl() || 'Non configuré'}
              {'\n'}Device ID: {apiService.getDeviceId()}
              {'\n'}Surveillance: {assignmentCheckStarted ? 'Active' : 'Inactive'}
              {'\n'}Mode: Lecture automatique en boucle
              {defaultPresentation && '\n'}Présentation par défaut: Configurée
            </Text>
          </LinearGradient>
        </View>
      </ScrollView>

      {/* Notification discrète pour présentation par défaut */}
      {renderDefaultPresentationPrompt()}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingGradient: {
    padding: 40,
    borderRadius: 20,
    alignItems: 'center',
    margin: 20,
  },
  loadingText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '600',
    marginTop: 16,
    textAlign: 'center',
  },
  loadingSubtext: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 14,
    marginTop: 8,
    textAlign: 'center',
  },
  scrollContent: {
    paddingBottom: 20,
  },
  headerGradient: {
    paddingTop: 60,
    paddingBottom: 30,
    paddingHorizontal: 20,
  },
  header: {
    alignItems: 'center',
  },
  headerContent: {
    alignItems: 'center',
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.9)',
    marginBottom: 16,
    textAlign: 'center',
  },
  headerButtons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  // Styles pour le bouton de rafraîchissement
  refreshButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 25,
    paddingHorizontal: 20,
    paddingVertical: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  focusedRefreshButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.4)',
    borderWidth: 4,
    borderColor: '#ffffff',
    transform: [{ scale: 1.1 }],
    elevation: 8,
    shadowColor: '#ffffff',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  refreshButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
  },
  spinning: {
    // Animation de rotation pour l'icône de rafraîchissement
    transform: [{ rotate: '360deg' }],
  },
  statusCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 20,
    marginTop: -20,
    marginBottom: 24,
    borderLeftWidth: 4,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  statusHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  statusText: {
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
    flex: 1,
  },
  serverUrl: {
    fontSize: 14,
    color: '#6b7280',
    fontFamily: 'monospace',
    marginBottom: 4,
  },
  configHint: {
    fontSize: 12,
    color: '#9ca3af',
    marginTop: 4,
    fontStyle: 'italic',
  },
  assignmentStatus: {
    fontSize: 12,
    color: '#10b981',
    fontWeight: '600',
    marginTop: 4,
  },
  assignedSection: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  assignedTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: 12,
  },
  assignedCard: {
    borderRadius: 16,
    overflow: 'hidden',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  assignedGradient: {
    padding: 20,
    minHeight: 140,
  },
  assignedHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  assignedBadges: {
    flexDirection: 'row',
    gap: 8,
  },
  autoPlayBadge: {
    backgroundColor: 'rgba(16, 185, 129, 0.3)',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  loopBadge: {
    backgroundColor: 'rgba(59, 130, 246, 0.3)',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  defaultBadge: {
    backgroundColor: 'rgba(139, 92, 246, 0.3)',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  badgeText: {
    color: '#ffffff',
    fontSize: 10,
    fontWeight: 'bold',
  },
  assignedName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 6,
  },
  assignedDescription: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.9)',
    marginBottom: 12,
  },
  assignedFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  assignedMode: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 12,
    fontWeight: '500',
  },
  assignedPlayButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    borderRadius: 20,
    width: 36,
    height: 36,
    justifyContent: 'center',
    alignItems: 'center',
  },
  section: {
    padding: 20,
  },
  sectionHeader: {
    marginBottom: 20,
    alignItems: 'center',
  },
  sectionTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1e293b',
    textAlign: 'center',
    marginBottom: 4,
  },
  // Sous-titre pour indiquer le mode boucle
  sectionSubtitle: {
    fontSize: 14,
    color: '#10b981',
    fontWeight: '600',
    textAlign: 'center',
  },
  presentationsGrid: {
    gap: 16,
  },
  presentationCard: {
    borderRadius: 20,
    overflow: 'hidden',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  cardGradient: {
    padding: 24,
    minHeight: 220,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  slideCountBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  slideCountText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  cardContent: {
    flex: 1,
    marginBottom: 16,
  },
  presentationTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 8,
    lineHeight: 26,
  },
  presentationDescription: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.9)',
    lineHeight: 20,
    marginBottom: 12,
  },
  // Indicateur de lecture automatique en boucle
  autoLoopIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(16, 185, 129, 0.3)',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
    alignSelf: 'flex-start',
    gap: 4,
  },
  autoLoopText: {
    color: 'rgba(255, 255, 255, 0.9)',
    fontSize: 11,
    fontWeight: '600',
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  createdDate: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 12,
    fontWeight: '500',
  },
  playButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    borderRadius: 25,
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  // Styles pour les éléments focalisés avec bordures très visibles
  focusedCard: {
    borderWidth: 4,
    borderColor: '#3b82f6',
    transform: [{ scale: 1.05 }],
    elevation: 16,
    shadowColor: '#3b82f6',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.5,
    shadowRadius: 16,
  },
  focusedPlayButton: {
    backgroundColor: 'rgba(59, 130, 246, 0.8)',
    transform: [{ scale: 1.1 }],
  },
  configurationNeeded: {
    alignItems: 'center',
    padding: 40,
    backgroundColor: '#ffffff',
    borderRadius: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  configTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1e293b',
    marginTop: 16,
    marginBottom: 8,
    textAlign: 'center',
  },
  configMessage: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 20,
  },
  configButton: {
    backgroundColor: '#3b82f6',
    borderRadius: 12,
    paddingHorizontal: 24,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  configButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  disconnectedState: {
    alignItems: 'center',
    padding: 40,
    backgroundColor: '#ffffff',
    borderRadius: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  disconnectedTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#ef4444',
    marginTop: 16,
    marginBottom: 8,
    textAlign: 'center',
  },
  disconnectedMessage: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 20,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  retryButton: {
    backgroundColor: '#10b981',
    borderRadius: 8,
    paddingHorizontal: 20,
    paddingVertical: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  retryButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
  },
  settingsButton: {
    backgroundColor: '#3b82f6',
    borderRadius: 8,
    paddingHorizontal: 20,
    paddingVertical: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  settingsButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
  },
  emptyState: {
    alignItems: 'center',
    padding: 40,
    backgroundColor: '#ffffff',
    borderRadius: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1e293b',
    marginTop: 16,
    marginBottom: 8,
    textAlign: 'center',
  },
  emptyMessage: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 16,
  },
  infoSection: {
    padding: 20,
  },
  infoCard: {
    padding: 24,
    borderRadius: 20,
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  infoTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#ffffff',
    marginTop: 12,
    marginBottom: 8,
    textAlign: 'center',
  },
  infoText: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.9)',
    textAlign: 'center',
    lineHeight: 20,
  },
  // Styles pour la notification de présentation par défaut
  promptOverlay: {
    position: 'absolute',
    top: 100,
    right: 20,
    zIndex: 1000,
  },
  promptCard: {
    borderRadius: 12,
    overflow: 'hidden',
    elevation: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    maxWidth: 320,
  },
  promptGradient: {
    padding: 16,
  },
  promptHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  promptTitle: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: 'bold',
    flex: 1,
    marginLeft: 8,
  },
  promptCloseButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 12,
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  promptCloseText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  promptMessage: {
    color: 'rgba(255, 255, 255, 0.9)',
    fontSize: 12,
    marginBottom: 12,
    lineHeight: 16,
  },
  promptActions: {
    flexDirection: 'row',
    gap: 8,
  },
  promptButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flex: 1,
  },
  promptCancelButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  promptButtonText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
    flex: 1,
  },
});