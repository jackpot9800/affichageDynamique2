import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  Dimensions,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  StatusBar,
  ScrollView,
  Platform,
} from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { ArrowLeft, Play, Pause, SkipBack, SkipForward, Monitor, Clock, CircleAlert as AlertCircle, RefreshCw, RotateCcw, Repeat } from 'lucide-react-native';
import { apiService, PresentationDetails, Slide } from '@/services/ApiService';
import { activateKeepAwakeAsync, deactivateKeepAwake } from 'expo-keep-awake';

const { width, height } = Dimensions.get('window');

// CORRECTION: Import conditionnel de TVEventHandler
let TVEventHandler: any = null;
if (Platform.OS === 'android' || Platform.OS === 'ios') {
  try {
    TVEventHandler = require('react-native').TVEventHandler;
  } catch (error) {
    console.log('TVEventHandler not available on this platform');
  }
}

export default function PresentationScreen() {
  const { id, auto_play, loop_mode, assigned } = useLocalSearchParams();
  const [presentation, setPresentation] = useState<PresentationDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLooping, setIsLooping] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [imageLoadError, setImageLoadError] = useState<{[key: number]: boolean}>({});
  const [loopCount, setLoopCount] = useState(0);
  const [focusedControlIndex, setFocusedControlIndex] = useState(1); // Commencer sur le bouton play/pause
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const hideControlsTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const tvEventHandlerRef = useRef<any>(null);

  useEffect(() => {
    loadPresentation();
    
    // Activer le Wake Lock pour empêcher la mise en veille
    activateKeepAwakeAsync('presentation-view')
      .then(() => {
        console.log('✅ Wake Lock activé pour la présentation - L\'écran restera allumé');
      })
      .catch((error) => {
        console.warn('⚠️ Impossible d\'activer le Wake Lock pour la présentation:', error);
      });
    
    // Configurer selon les paramètres d'assignation
    if (auto_play === 'true') {
      console.log('Auto-play enabled from assignment');
    }
    if (loop_mode === 'true') {
      console.log('Loop mode enabled from assignment');
      setIsLooping(true);
    }

    // CORRECTION: Configuration spécifique Fire TV seulement sur les plateformes supportées
    if (Platform.OS === 'android' && TVEventHandler) {
      setupFireTVControls();
    }
    
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      if (hideControlsTimeoutRef.current) {
        clearTimeout(hideControlsTimeoutRef.current);
        hideControlsTimeoutRef.current = null;
      }
      if (tvEventHandlerRef.current) {
        try {
          tvEventHandlerRef.current.disable();
        } catch (error) {
          console.log('Error disabling TV event handler:', error);
        }
      }
      
      // Désactiver le Wake Lock au démontage
      deactivateKeepAwake('presentation-view');
    };
  }, []);

  // CORRECTION: Configuration des contrôles Fire TV avec vérifications
  const setupFireTVControls = () => {
    if (!TVEventHandler) {
      console.log('TVEventHandler not available');
      return;
    }

    try {
      tvEventHandlerRef.current = new TVEventHandler();
      tvEventHandlerRef.current.enable(null, (cmp: any, evt: any) => {
        if (!evt) return;

        console.log('Fire TV Event:', evt.eventType);
        
        // Afficher les contrôles lors de toute interaction
        setShowControls(true);

        switch (evt.eventType) {
          case 'right':
            handleNavigateRight();
            break;
          case 'left':
            handleNavigateLeft();
            break;
          case 'up':
            handleNavigateUp();
            break;
          case 'down':
            handleNavigateDown();
            break;
          case 'select':
          case 'playPause':
            handleSelectAction();
            break;
          case 'rewind':
            previousSlide();
            break;
          case 'fastForward':
            nextSlide();
            break;
          case 'menu':
            toggleControls();
            break;
          case 'back':
            router.back();
            break;
        }
      });
    } catch (error) {
      console.log('TVEventHandler not available, using fallback controls:', error);
    }
  };

  // Navigation améliorée pour Fire TV
  const handleNavigateRight = () => {
    const maxIndex = getMaxFocusIndex();
    if (focusedControlIndex < maxIndex) {
      setFocusedControlIndex(focusedControlIndex + 1);
    }
  };

  const handleNavigateLeft = () => {
    if (focusedControlIndex > -1) {
      setFocusedControlIndex(focusedControlIndex - 1);
    }
  };

  const handleNavigateUp = () => {
    // Navigation vers les contrôles du haut
    if (focusedControlIndex >= 5) {
      setFocusedControlIndex(1); // Retour au play/pause
    }
  };

  const handleNavigateDown = () => {
    // Navigation vers les miniatures
    if (focusedControlIndex < 5 && presentation && presentation.slides.length > 0) {
      setFocusedControlIndex(5); // Premier slide
    }
  };

  const getMaxFocusIndex = () => {
    const baseControls = 4; // -1 (back), 0 (prev), 1 (play), 2 (next), 3 (restart), 4 (loop)
    const slidesCount = presentation?.slides.length || 0;
    return baseControls + slidesCount;
  };

  const handleSelectAction = () => {
    switch (focusedControlIndex) {
      case -1:
        router.back();
        break;
      case 0:
        previousSlide();
        break;
      case 1:
        togglePlayPause();
        break;
      case 2:
        nextSlide();
        break;
      case 3:
        restartPresentation();
        break;
      case 4:
        toggleLoop();
        break;
      default:
        // Navigation vers un slide spécifique
        if (focusedControlIndex >= 5 && presentation) {
          const slideIndex = focusedControlIndex - 5;
          if (slideIndex < presentation.slides.length) {
            goToSlide(slideIndex);
          }
        }
        break;
    }
  };

  // Démarrer automatiquement si c'est une présentation assignée ou en auto-play
  useEffect(() => {
    if (presentation && auto_play === 'true') {
      console.log('=== AUTO-STARTING PRESENTATION ===');
      setTimeout(() => {
        setIsPlaying(true);
        setShowControls(false);
      }, 1000);
    }
  }, [presentation, auto_play]);

  // Gérer le timer de slide avec nettoyage complet
  useEffect(() => {
    console.log('=== TIMER EFFECT TRIGGERED ===');
    console.log('isPlaying:', isPlaying);
    console.log('currentSlideIndex:', currentSlideIndex);
    console.log('presentation slides:', presentation?.slides.length || 0);

    if (isPlaying && presentation && presentation.slides.length > 0) {
      startSlideTimer();
    } else {
      stopSlideTimer();
    }

    return () => {
      if (intervalRef.current) {
        console.log('=== CLEANING TIMER FROM EFFECT ===');
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [isPlaying, currentSlideIndex, presentation]);

  // Auto-masquage des contrôles amélioré
  useEffect(() => {
    if (hideControlsTimeoutRef.current) {
      clearTimeout(hideControlsTimeoutRef.current);
      hideControlsTimeoutRef.current = null;
    }

    if (showControls) {
      const hideDelay = assigned === 'true' ? 2000 : (isPlaying ? 3000 : 5000);
      
      console.log(`=== SETTING HIDE TIMEOUT: ${hideDelay}ms ===`);
      hideControlsTimeoutRef.current = setTimeout(() => {
        console.log('=== HIDING CONTROLS ===');
        setShowControls(false);
      }, hideDelay);
    }
    
    return () => {
      if (hideControlsTimeoutRef.current) {
        clearTimeout(hideControlsTimeoutRef.current);
        hideControlsTimeoutRef.current = null;
      }
    };
  }, [showControls, isPlaying, assigned]);

  const loadPresentation = async () => {
    try {
      setLoading(true);
      setError(null);
      console.log('Loading presentation with ID:', id);
      
      const data = await apiService.getPresentation(Number(id));
      console.log('Loaded presentation:', data);
      
      setPresentation(data);
      
      if (data.slides.length > 0) {
        setTimeRemaining(data.slides[0].duration * 1000);
      }
    } catch (error) {
      console.error('Error loading presentation:', error);
      const errorMessage = error instanceof Error ? error.message : 'Erreur inconnue';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const stopSlideTimer = () => {
    if (intervalRef.current) {
      console.log('=== STOPPING SLIDE TIMER ===');
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  };

  const startSlideTimer = () => {
    if (!presentation || presentation.slides.length === 0) {
      console.log('=== NO PRESENTATION OR SLIDES, NOT STARTING TIMER ===');
      return;
    }

    stopSlideTimer();

    const currentSlide = presentation.slides[currentSlideIndex];
    const slideDuration = currentSlide.duration * 1000;
    
    console.log(`=== STARTING NEW TIMER FOR SLIDE ${currentSlideIndex + 1} ===`);
    console.log(`Slide duration: ${currentSlide.duration}s (${slideDuration}ms)`);
    
    setTimeRemaining(slideDuration);

    intervalRef.current = setInterval(() => {
      setTimeRemaining((prev) => {
        const newTime = prev - 100;
        
        if (newTime <= 0) {
          console.log(`=== TIMER FINISHED FOR SLIDE ${currentSlideIndex + 1} ===`);
          nextSlide();
          return 0;
        }
        
        return newTime;
      });
    }, 100);

    console.log('=== TIMER STARTED SUCCESSFULLY ===');
  };

  const togglePlayPause = () => {
    console.log('=== TOGGLE PLAY/PAUSE ===');
    console.log('Current state:', isPlaying ? 'PLAYING' : 'PAUSED');
    
    const newPlayingState = !isPlaying;
    setIsPlaying(newPlayingState);
    setShowControls(true);
  };

  const toggleLoop = () => {
    setIsLooping(!isLooping);
    setShowControls(true);
    
    Alert.alert(
      'Mode boucle',
      isLooping ? 'Mode boucle désactivé' : 'Mode boucle activé - La présentation se répétera automatiquement',
      [{ text: 'OK' }]
    );
  };

  const nextSlide = () => {
    if (!presentation) return;
    
    console.log(`=== NEXT SLIDE LOGIC ===`);
    console.log(`Current: ${currentSlideIndex + 1}/${presentation.slides.length}`);
    console.log(`Is looping: ${isLooping}`);
    console.log(`Is playing: ${isPlaying}`);
    
    if (currentSlideIndex < presentation.slides.length - 1) {
      const nextIndex = currentSlideIndex + 1;
      console.log(`Moving to slide ${nextIndex + 1}`);
      setCurrentSlideIndex(nextIndex);
    } else {
      console.log('End of presentation reached');
      
      if (isLooping) {
        console.log(`Loop ${loopCount + 1} completed, restarting...`);
        setCurrentSlideIndex(0);
        setLoopCount(prev => prev + 1);
      } else {
        console.log('Stopping playback, showing options');
        setIsPlaying(false);
        setCurrentSlideIndex(0);
        setShowControls(true);
        
        if (assigned === 'true') {
          Alert.alert(
            'Présentation terminée',
            'La présentation assignée est terminée. Elle va recommencer automatiquement.',
            [
              { text: 'Recommencer maintenant', onPress: () => { setIsPlaying(true); setIsLooping(true); } },
              { text: 'Arrêter', onPress: () => router.back() },
            ]
          );
          
          setTimeout(() => {
            setIsLooping(true);
            setIsPlaying(true);
          }, 5000);
        } else {
          Alert.alert(
            'Présentation terminée',
            'La présentation est arrivée à sa fin.',
            [
              { text: 'Recommencer', onPress: () => setIsPlaying(true) },
              { text: 'Mode boucle', onPress: () => { setIsLooping(true); setIsPlaying(true); } },
              { text: 'Retour', onPress: () => router.back() },
            ]
          );
        }
      }
    }
  };

  const previousSlide = () => {
    if (currentSlideIndex > 0) {
      console.log(`Moving to previous slide: ${currentSlideIndex}`);
      setCurrentSlideIndex(currentSlideIndex - 1);
    }
    setShowControls(true);
  };

  const goToSlide = (index: number) => {
    console.log(`Jumping to slide ${index + 1}`);
    setCurrentSlideIndex(index);
    setShowControls(true);
  };

  const restartPresentation = () => {
    console.log('=== RESTARTING PRESENTATION ===');
    setCurrentSlideIndex(0);
    setLoopCount(0);
    setIsPlaying(true);
    setShowControls(true);
  };

  const toggleControls = () => {
    console.log('=== TOGGLE CONTROLS ===');
    console.log('Current showControls:', showControls);
    setShowControls(!showControls);
  };

  const formatTime = (milliseconds: number) => {
    const seconds = Math.ceil(milliseconds / 1000);
    return `${seconds}s`;
  };

  const handleImageError = (slideId: number) => {
    console.error('Image load error for slide:', slideId);
    setImageLoadError(prev => ({ ...prev, [slideId]: true }));
  };

  const retryLoadPresentation = () => {
    setError(null);
    setImageLoadError({});
    loadPresentation();
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#3b82f6" />
        <Text style={styles.loadingText}>Chargement de la présentation...</Text>
        {assigned === 'true' && (
          <Text style={styles.assignedText}>Présentation assignée</Text>
        )}
        {auto_play === 'true' && (
          <Text style={styles.autoPlayText}>Lecture automatique activée</Text>
        )}
        <Text style={styles.wakeText}>🔒 Wake Lock activé - Écran toujours allumé</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.errorContainer}>
        <AlertCircle size={64} color="#ef4444" />
        <Text style={styles.errorTitle}>Erreur de chargement</Text>
        <Text style={styles.errorMessage}>{error}</Text>
        
        <View style={styles.errorActions}>
          <TouchableOpacity 
            style={[
              styles.retryButton,
              focusedControlIndex === 0 && styles.focusedButton
            ]} 
            onPress={retryLoadPresentation}
            accessible={true}
            accessibilityLabel="Réessayer le chargement"
            accessibilityRole="button"
            onFocus={() => setFocusedControlIndex(0)}
          >
            <RefreshCw size={20} color="#ffffff" />
            <Text style={styles.retryButtonText}>Réessayer</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[
              styles.backButton,
              focusedControlIndex === 1 && styles.focusedButton
            ]} 
            onPress={() => router.back()}
            accessible={true}
            accessibilityLabel="Retour à la liste"
            accessibilityRole="button"
            onFocus={() => setFocusedControlIndex(1)}
          >
            <ArrowLeft size={20} color="#ffffff" />
            <Text style={styles.backButtonText}>Retour</Text>
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.debugContainer}>
          <Text style={styles.debugTitle}>Informations de debug:</Text>
          <Text style={styles.debugText}>ID: {id}</Text>
          <Text style={styles.debugText}>Serveur: {apiService.getServerConfig().host}</Text>
          <Text style={styles.debugText}>Assignée: {assigned === 'true' ? 'Oui' : 'Non'}</Text>
          <Text style={styles.debugText}>Auto-play: {auto_play === 'true' ? 'Oui' : 'Non'}</Text>
          <Text style={styles.debugText}>Loop: {loop_mode === 'true' ? 'Oui' : 'Non'}</Text>
          <Text style={styles.debugText}>Erreur: {error}</Text>
        </ScrollView>
      </View>
    );
  }

  if (!presentation || presentation.slides.length === 0) {
    return (
      <View style={styles.errorContainer}>
        <Monitor size={64} color="#ef4444" />
        <Text style={styles.errorTitle}>Présentation vide</Text>
        <Text style={styles.errorMessage}>
          Cette présentation ne contient aucune slide valide.
        </Text>
        <TouchableOpacity 
          style={styles.backButton} 
          onPress={() => router.back()}
          accessible={true}
          accessibilityLabel="Retour à la liste"
          accessibilityRole="button"
        >
          <ArrowLeft size={20} color="#ffffff" />
          <Text style={styles.backButtonText}>Retour</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const currentSlide = presentation.slides[currentSlideIndex];
  const progress = presentation.slides[currentSlideIndex].duration > 0 
    ? ((presentation.slides[currentSlideIndex].duration * 1000 - timeRemaining) / (presentation.slides[currentSlideIndex].duration * 1000)) * 100
    : 0;

  return (
    <View style={styles.container}>
      <StatusBar hidden />
      
      <TouchableOpacity
        style={styles.slideContainer}
        onPress={toggleControls}
        activeOpacity={1}
        accessible={true}
        accessibilityLabel={`Slide ${currentSlideIndex + 1} sur ${presentation.slides.length}. Appuyez pour afficher les contrôles.`}
      >
        {imageLoadError[currentSlide.id] ? (
          <View style={styles.imageErrorContainer}>
            <AlertCircle size={48} color="#ef4444" />
            <Text style={styles.imageErrorText}>Impossible de charger l'image</Text>
            <Text style={styles.imageErrorUrl}>{currentSlide.image_url}</Text>
          </View>
        ) : (
          <Image
            source={{ uri: currentSlide.image_url }}
            style={styles.slideImage}
            resizeMode="contain"
            onError={() => handleImageError(currentSlide.id)}
            onLoad={() => console.log('Image loaded successfully:', currentSlide.image_url)}
          />
        )}
        
        <View style={styles.progressContainer}>
          <View style={[styles.progressBar, { width: `${progress}%` }]} />
        </View>

        {isLooping && (
          <View style={styles.loopIndicator}>
            <Repeat size={16} color="#ffffff" />
            <Text style={styles.loopText}>
              BOUCLE {loopCount > 0 ? `(${loopCount})` : ''}
            </Text>
          </View>
        )}

        {assigned === 'true' && (
          <View style={styles.assignedIndicator}>
            <Monitor size={16} color="#ffffff" />
            <Text style={styles.assignedText}>ASSIGNÉE</Text>
          </View>
        )}

        {auto_play === 'true' && (
          <View style={styles.autoPlayIndicator}>
            <Play size={16} color="#ffffff" />
            <Text style={styles.autoPlayText}>AUTO</Text>
          </View>
        )}
        
        <View style={styles.wakeLockIndicator}>
          <Text style={styles.wakeLockText}>🔒 ÉCRAN ACTIF</Text>
        </View>
      </TouchableOpacity>

      {showControls && (
        <View style={styles.controlsOverlay}>
          <LinearGradient
            colors={['rgba(0,0,0,0.8)', 'transparent', 'rgba(0,0,0,0.8)']}
            style={styles.controlsGradient}
          >
            <View style={styles.topControls}>
              <TouchableOpacity
                style={[
                  styles.backIconButton,
                  focusedControlIndex === -1 && styles.focusedControl
                ]}
                onPress={() => router.back()}
                accessible={true}
                accessibilityLabel="Retour à la liste des présentations"
                accessibilityRole="button"
                onFocus={() => setFocusedControlIndex(-1)}
              >
                <ArrowLeft size={24} color="#ffffff" />
              </TouchableOpacity>
              
              <View style={styles.presentationInfo}>
                <Text style={styles.presentationTitle} numberOfLines={1}>
                  {presentation.name}
                  {assigned === 'true' && ' (Assignée)'}
                </Text>
                <Text style={styles.slideCounter}>
                  {currentSlideIndex + 1} / {presentation.slides.length}
                  {isLooping && loopCount > 0 && ` • Boucle ${loopCount}`}
                </Text>
              </View>

              <View style={styles.timeInfo}>
                <Clock size={16} color="#ffffff" />
                <Text style={styles.timeText}>
                  {formatTime(timeRemaining)}
                </Text>
              </View>
            </View>

            <View style={styles.bottomControls}>
              <View style={styles.controlButtons}>
                <TouchableOpacity
                  style={[
                    styles.controlButton, 
                    currentSlideIndex === 0 && styles.controlButtonDisabled,
                    focusedControlIndex === 0 && styles.focusedControl
                  ]}
                  onPress={previousSlide}
                  disabled={currentSlideIndex === 0}
                  accessible={true}
                  accessibilityLabel="Slide précédente"
                  accessibilityRole="button"
                  onFocus={() => setFocusedControlIndex(0)}
                >
                  <SkipBack size={24} color={currentSlideIndex === 0 ? "#6b7280" : "#ffffff"} />
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.controlButton, 
                    styles.playButton,
                    focusedControlIndex === 1 && styles.focusedControl
                  ]}
                  onPress={togglePlayPause}
                  accessible={true}
                  accessibilityLabel={isPlaying ? "Mettre en pause" : "Lancer la lecture"}
                  accessibilityRole="button"
                  onFocus={() => setFocusedControlIndex(1)}
                >
                  {isPlaying ? (
                    <Pause size={28} color="#ffffff" fill="#ffffff" />
                  ) : (
                    <Play size={28} color="#ffffff" fill="#ffffff" />
                  )}
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.controlButton, 
                    currentSlideIndex === presentation.slides.length - 1 && !isLooping && styles.controlButtonDisabled,
                    focusedControlIndex === 2 && styles.focusedControl
                  ]}
                  onPress={nextSlide}
                  disabled={currentSlideIndex === presentation.slides.length - 1 && !isLooping}
                  accessible={true}
                  accessibilityLabel="Slide suivante"
                  accessibilityRole="button"
                  onFocus={() => setFocusedControlIndex(2)}
                >
                  <SkipForward size={24} color={currentSlideIndex === presentation.slides.length - 1 && !isLooping ? "#6b7280" : "#ffffff"} />
                </TouchableOpacity>
              </View>

              <View style={styles.additionalControls}>
                <TouchableOpacity
                  style={[
                    styles.controlButton, 
                    styles.smallButton,
                    focusedControlIndex === 3 && styles.focusedControl
                  ]}
                  onPress={restartPresentation}
                  accessible={true}
                  accessibilityLabel="Recommencer la présentation"
                  accessibilityRole="button"
                  onFocus={() => setFocusedControlIndex(3)}
                >
                  <RotateCcw size={20} color="#ffffff" />
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.controlButton, 
                    styles.smallButton, 
                    isLooping && styles.activeButton,
                    focusedControlIndex === 4 && styles.focusedControl
                  ]}
                  onPress={toggleLoop}
                  accessible={true}
                  accessibilityLabel={isLooping ? "Désactiver le mode boucle" : "Activer le mode boucle"}
                  accessibilityRole="button"
                  onFocus={() => setFocusedControlIndex(4)}
                >
                  <Repeat size={20} color="#ffffff" />
                </TouchableOpacity>
              </View>

              <View style={styles.thumbnailContainer}>
                {presentation.slides.map((slide, index) => (
                  <TouchableOpacity
                    key={slide.id}
                    style={[
                      styles.thumbnail,
                      index === currentSlideIndex && styles.activeThumbnail,
                      focusedControlIndex === 5 + index && styles.focusedThumbnail,
                    ]}
                    onPress={() => goToSlide(index)}
                    accessible={true}
                    accessibilityLabel={`Aller à la slide ${index + 1}`}
                    accessibilityRole="button"
                    onFocus={() => setFocusedControlIndex(5 + index)}
                  >
                    <View style={styles.thumbnailNumber}>
                      <Text style={styles.thumbnailNumberText}>{index + 1}</Text>
                    </View>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </LinearGradient>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#0a0a0a',
  },
  loadingText: {
    color: '#ffffff',
    fontSize: 16,
    marginTop: 16,
  },
  assignedText: {
    color: '#f59e0b',
    fontSize: 12,
    fontWeight: 'bold',
    marginTop: 8,
  },
  autoPlayText: {
    color: '#10b981',
    fontSize: 12,
    fontWeight: 'bold',
    marginTop: 4,
  },
  wakeText: {
    color: '#3b82f6',
    fontSize: 12,
    fontWeight: 'bold',
    marginTop: 8,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#0a0a0a',
    padding: 40,
  },
  errorTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#ffffff',
    marginTop: 16,
    marginBottom: 8,
    textAlign: 'center',
  },
  errorMessage: {
    fontSize: 16,
    color: '#9ca3af',
    textAlign: 'center',
    marginBottom: 32,
    lineHeight: 22,
  },
  errorActions: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 32,
  },
  retryButton: {
    backgroundColor: '#3b82f6',
    borderRadius: 8,
    paddingHorizontal: 24,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  retryButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  backButton: {
    backgroundColor: '#6b7280',
    borderRadius: 8,
    paddingHorizontal: 24,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  backButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  debugContainer: {
    maxHeight: 200,
    width: '100%',
    backgroundColor: '#1a1a1a',
    borderRadius: 8,
    padding: 16,
  },
  debugTitle: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  debugText: {
    color: '#9ca3af',
    fontSize: 12,
    marginBottom: 4,
  },
  slideContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  slideImage: {
    width: width,
    height: height,
  },
  imageErrorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  imageErrorText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 16,
    marginBottom: 8,
    textAlign: 'center',
  },
  imageErrorUrl: {
    color: '#9ca3af',
    fontSize: 12,
    textAlign: 'center',
  },
  progressContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  progressBar: {
    height: '100%',
    backgroundColor: '#3b82f6',
  },
  loopIndicator: {
    position: 'absolute',
    top: 20,
    right: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  loopText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  assignedIndicator: {
    position: 'absolute',
    top: 20,
    left: 20,
    backgroundColor: 'rgba(245, 158, 11, 0.9)',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  assignedText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  autoPlayIndicator: {
    position: 'absolute',
    top: 70,
    left: 20,
    backgroundColor: 'rgba(16, 185, 129, 0.9)',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  autoPlayText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  wakeLockIndicator: {
    position: 'absolute',
    top: 120,
    left: 20,
    backgroundColor: 'rgba(59, 130, 246, 0.9)',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  wakeLockText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  controlsOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    pointerEvents: 'box-none',
  },
  controlsGradient: {
    flex: 1,
    justifyContent: 'space-between',
  },
  topControls: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 40,
    paddingBottom: 20,
  },
  backIconButton: {
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    borderRadius: 20,
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  presentationInfo: {
    flex: 1,
    marginHorizontal: 16,
  },
  presentationTitle: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  slideCounter: {
    color: '#9ca3af',
    fontSize: 14,
  },
  timeInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  timeText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 4,
  },
  bottomControls: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  controlButtons: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  controlButton: {
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    borderRadius: 25,
    width: 50,
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 8,
  },
  controlButtonDisabled: {
    opacity: 0.5,
  },
  playButton: {
    backgroundColor: '#3b82f6',
    width: 60,
    height: 60,
    borderRadius: 30,
    marginHorizontal: 16,
  },
  additionalControls: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    gap: 12,
  },
  smallButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginHorizontal: 0,
  },
  activeButton: {
    backgroundColor: '#10b981',
  },
  thumbnailContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    flexWrap: 'wrap',
    gap: 8,
  },
  thumbnail: {
    width: 40,
    height: 40,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  activeThumbnail: {
    borderColor: '#3b82f6',
    backgroundColor: 'rgba(59, 130, 246, 0.3)',
  },
  thumbnailNumber: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  thumbnailNumberText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  // CORRECTION: Styles pour les indicateurs de focus Fire TV améliorés
  focusedControl: {
    borderWidth: 4,
    borderColor: '#3b82f6',
    transform: [{ scale: 1.15 }],
    backgroundColor: 'rgba(59, 130, 246, 0.4)',
    elevation: 12,
    shadowColor: '#3b82f6',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.6,
    shadowRadius: 12,
  },
  focusedButton: {
    borderWidth: 4,
    borderColor: '#3b82f6',
    transform: [{ scale: 1.1 }],
    elevation: 12,
    shadowColor: '#3b82f6',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.5,
    shadowRadius: 10,
  },
  focusedThumbnail: {
    borderColor: '#f59e0b',
    borderWidth: 4,
    transform: [{ scale: 1.3 }],
    backgroundColor: 'rgba(245, 158, 11, 0.5)',
    elevation: 10,
    shadowColor: '#f59e0b',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
  },
});