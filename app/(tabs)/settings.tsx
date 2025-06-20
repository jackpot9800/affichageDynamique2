import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Alert,
  ScrollView,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Server, Wifi, WifiOff, Check, CircleAlert as AlertCircle, Monitor, Settings as SettingsIcon, RefreshCw, Trash2, UserPlus, Folder, Globe } from 'lucide-react-native';
import { apiService, ServerConfig } from '@/services/ApiService';

// Import conditionnel de TVEventHandler
let TVEventHandler: any = null;
if (Platform.OS === 'android' || Platform.OS === 'ios') {
  try {
    TVEventHandler = require('react-native').TVEventHandler;
  } catch (error) {
    console.log('TVEventHandler not available on this platform');
  }
}

export default function SettingsScreen() {
  const [serverHost, setServerHost] = useState('');
  const [apiPath, setApiPath] = useState('api/');
  const [uploadsPath, setUploadsPath] = useState('uploads/');
  const [originalConfig, setOriginalConfig] = useState<ServerConfig>({ host: '', apiPath: 'api/', uploadsPath: 'uploads/' });
  const [connectionStatus, setConnectionStatus] = useState<'idle' | 'testing' | 'success' | 'error'>('idle');
  const [saving, setSaving] = useState(false);
  const [registering, setRegistering] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [debugInfo, setDebugInfo] = useState<any>(null);
  const [focusedIndex, setFocusedIndex] = useState(0);
  const [tvEventHandler, setTvEventHandler] = useState<any>(null);

  useEffect(() => {
    loadCurrentSettings();
    loadDebugInfo();
    
    // Configuration Fire TV seulement sur les plateformes supportées
    if (Platform.OS === 'android' && TVEventHandler) {
      setupFireTVNavigation();
    }

    return () => {
      if (tvEventHandler) {
        try {
          tvEventHandler.disable();
        } catch (error) {
          console.log('Error disabling TV event handler:', error);
        }
      }
    };
  }, []);

  useEffect(() => {
    const currentConfig = { host: serverHost, apiPath, uploadsPath };
    setHasChanges(
      currentConfig.host !== originalConfig.host ||
      currentConfig.apiPath !== originalConfig.apiPath ||
      currentConfig.uploadsPath !== originalConfig.uploadsPath
    );
  }, [serverHost, apiPath, uploadsPath, originalConfig]);

  // Configuration navigation Fire TV avec vérifications
  const setupFireTVNavigation = () => {
    if (!TVEventHandler) {
      console.log('TVEventHandler not available');
      return;
    }

    try {
      const handler = new TVEventHandler();
      handler.enable(null, (cmp: any, evt: any) => {
        if (!evt) return;

        console.log('Settings Fire TV Event:', evt.eventType);

        switch (evt.eventType) {
          case 'down':
            handleNavigateDown();
            break;
          case 'up':
            handleNavigateUp();
            break;
          case 'select':
            handleSelectAction();
            break;
          case 'back':
            // Laisser le comportement par défaut
            break;
        }
      });
      setTvEventHandler(handler);
    } catch (error) {
      console.log('TVEventHandler not available in settings:', error);
    }
  };

  const handleNavigateDown = () => {
    const maxIndex = 8; // 0-2: inputs, 3: test, 4: save, 5: register, 6: refresh, 7: reset device, 8: reset settings
    if (focusedIndex < maxIndex) {
      setFocusedIndex(focusedIndex + 1);
    }
  };

  const handleNavigateUp = () => {
    if (focusedIndex > 0) {
      setFocusedIndex(focusedIndex - 1);
    }
  };

  const handleSelectAction = () => {
    switch (focusedIndex) {
      case 0:
      case 1:
      case 2:
        // Input fields - ne rien faire, laisser le clavier apparaître
        break;
      case 3:
        testConnection();
        break;
      case 4:
        if (hasChanges && !saving) {
          saveSettings();
        }
        break;
      case 5:
        registerDevice();
        break;
      case 6:
        loadDebugInfo();
        break;
      case 7:
        resetDevice();
        break;
      case 8:
        resetSettings();
        break;
    }
  };

  const loadCurrentSettings = () => {
    const currentConfig = apiService.getServerConfig();
    setServerHost(currentConfig.host);
    setApiPath(currentConfig.apiPath);
    setUploadsPath(currentConfig.uploadsPath);
    setOriginalConfig(currentConfig);
  };

  const loadDebugInfo = async () => {
    try {
      const info = await apiService.getDebugInfo();
      setDebugInfo(info);
    } catch (error) {
      console.error('Error loading debug info:', error);
    }
  };

  const testConnection = async () => {
    if (!serverHost.trim()) {
      Alert.alert('Erreur', 'Veuillez entrer une adresse serveur valide.');
      return;
    }

    setConnectionStatus('testing');
    try {
      // Créer une configuration temporaire pour le test
      const tempConfig: ServerConfig = {
        host: serverHost.trim(),
        apiPath: apiPath.trim() || 'api/',
        uploadsPath: uploadsPath.trim() || 'uploads/'
      };
      
      console.log('Testing connection with config:', tempConfig);
      
      // Sauvegarder temporairement la configuration pour le test
      const success = await apiService.setServerConfig(tempConfig);
      
      if (success) {
        setConnectionStatus('success');
        
        Alert.alert(
          'Test de connexion réussi',
          `Connexion au serveur établie avec succès !\n\nServeur: ${tempConfig.host}\nAPI: ${tempConfig.apiPath}\nUploads: ${tempConfig.uploadsPath}`,
          [{ text: 'OK' }]
        );
      } else {
        setConnectionStatus('error');
        Alert.alert(
          'Test de connexion échoué',
          `Impossible de se connecter au serveur.\n\nVérifiez:\n• L'adresse du serveur\n• Les chemins API et uploads\n• Que le serveur est accessible`,
          [{ text: 'OK' }]
        );
      }
    } catch (error) {
      console.error('Connection test failed:', error);
      setConnectionStatus('error');
      
      Alert.alert(
        'Erreur de connexion',
        `Impossible de joindre le serveur:\n\n${error instanceof Error ? error.message : 'Erreur réseau'}\n\nVérifiez votre connexion réseau et la configuration.`,
        [{ text: 'OK' }]
      );
    }
  };

  const saveSettings = async () => {
    if (!serverHost.trim()) {
      Alert.alert('Erreur', 'Veuillez entrer une adresse serveur valide.');
      return;
    }

    setSaving(true);
    
    try {
      console.log('=== SAVING SETTINGS ===');
      
      const config: ServerConfig = {
        host: serverHost.trim(),
        apiPath: apiPath.trim() || 'api/',
        uploadsPath: uploadsPath.trim() || 'uploads/'
      };
      
      console.log('Server config:', config);
      
      const success = await apiService.setServerConfig(config);
      
      if (success) {
        setOriginalConfig(config);
        setConnectionStatus('success');
        await loadDebugInfo();
        
        Alert.alert(
          'Configuration sauvegardée',
          'La configuration a été sauvegardée avec succès et l\'appareil a été enregistré sur le serveur.',
          [{ text: 'Parfait !' }]
        );
      } else {
        setConnectionStatus('error');
        Alert.alert(
          'Erreur de sauvegarde',
          'Impossible de sauvegarder la configuration. Vérifiez les paramètres et la disponibilité du serveur.',
          [{ text: 'OK' }]
        );
      }
    } catch (error) {
      console.error('Error saving settings:', error);
      setConnectionStatus('error');
      Alert.alert(
        'Erreur de sauvegarde',
        `Une erreur est survenue lors de la sauvegarde:\n\n${error instanceof Error ? error.message : 'Erreur inconnue'}\n\nVeuillez réessayer.`,
        [{ text: 'OK' }]
      );
    } finally {
      setSaving(false);
    }
  };

  const registerDevice = async () => {
    if (!serverHost.trim()) {
      Alert.alert(
        'Configuration requise',
        'Veuillez d\'abord configurer et sauvegarder les paramètres du serveur.',
        [{ text: 'OK' }]
      );
      return;
    }

    setRegistering(true);
    
    try {
      console.log('=== MANUAL DEVICE REGISTRATION ===');
      
      // Vérifier d'abord si l'appareil est déjà enregistré
      if (apiService.isDeviceRegistered()) {
        Alert.alert(
          'Appareil déjà enregistré',
          `Cet appareil est déjà enregistré sur le serveur.\n\nID: ${apiService.getDeviceId()}\n\nVoulez-vous forcer un nouvel enregistrement ?`,
          [
            { text: 'Annuler', style: 'cancel' },
            { 
              text: 'Forcer', 
              style: 'destructive',
              onPress: async () => {
                await apiService.resetDevice();
                await performRegistration();
              }
            }
          ]
        );
        return;
      }

      await performRegistration();
      
    } catch (error) {
      console.error('Manual registration failed:', error);
      Alert.alert(
        'Erreur d\'enregistrement',
        `Impossible d'enregistrer l'appareil:\n\n${error instanceof Error ? error.message : 'Erreur inconnue'}\n\nVérifiez votre connexion et la configuration du serveur.`,
        [{ text: 'OK' }]
      );
    } finally {
      setRegistering(false);
    }
  };

  const performRegistration = async () => {
    try {
      console.log('=== PERFORMING DEVICE REGISTRATION ===');
      
      // Tester la connexion d'abord
      const connectionOk = await apiService.testConnection();
      if (!connectionOk) {
        throw new Error('Impossible de se connecter au serveur');
      }

      console.log('Connection OK, proceeding with registration...');

      // Enregistrer l'appareil
      const registrationOk = await apiService.registerDevice();
      if (registrationOk) {
        await loadDebugInfo();
        
        Alert.alert(
          'Enregistrement réussi !',
          `L'appareil a été enregistré avec succès sur le serveur.\n\nID: ${apiService.getDeviceId()}\n\nVous pouvez maintenant utiliser toutes les fonctionnalités de l'application.`,
          [{ text: 'Parfait !' }]
        );
      } else {
        throw new Error('L\'enregistrement a échoué sans message d\'erreur');
      }
    } catch (error) {
      console.error('Registration failed:', error);
      throw error;
    }
  };

  const resetSettings = () => {
    Alert.alert(
      'Réinitialiser les paramètres',
      'Êtes-vous sûr de vouloir effacer la configuration du serveur ?',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Réinitialiser',
          style: 'destructive',
          onPress: async () => {
            setServerHost('');
            setApiPath('api/');
            setUploadsPath('uploads/');
            setConnectionStatus('idle');
            await apiService.resetDevice();
            await loadDebugInfo();
            
            Alert.alert(
              'Paramètres réinitialisés',
              'La configuration a été effacée. Vous devez reconfigurer les paramètres du serveur.',
              [{ text: 'OK' }]
            );
          },
        },
      ]
    );
  };

  const resetDevice = () => {
    Alert.alert(
      'Réinitialiser l\'appareil',
      'Cela va supprimer l\'enregistrement de l\'appareil sur le serveur. Vous devrez le reconfigurer.',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Réinitialiser',
          style: 'destructive',
          onPress: async () => {
            await apiService.resetDevice();
            await loadDebugInfo();
            Alert.alert(
              'Appareil réinitialisé',
              'L\'enregistrement de l\'appareil a été supprimé. Utilisez le bouton d\'enregistrement pour le réenregistrer.',
              [{ text: 'OK' }]
            );
          },
        },
      ]
    );
  };

  const renderConnectionStatus = () => {
    const statusConfig = {
      idle: { color: '#6b7280', text: 'Non testé', icon: Server },
      testing: { color: '#f59e0b', text: 'Test en cours...', icon: Wifi },
      success: { color: '#10b981', text: 'Connexion réussie', icon: Check },
      error: { color: '#ef4444', text: 'Connexion échouée', icon: AlertCircle },
    };

    const config = statusConfig[connectionStatus];
    const IconComponent = config.icon;

    return (
      <View style={[styles.statusContainer, { borderColor: config.color }]}>
        <IconComponent size={20} color={config.color} />
        <Text style={[styles.statusText, { color: config.color }]}>
          {config.text}
        </Text>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <LinearGradient
            colors={['#4f46e5', '#7c3aed']}
            style={styles.headerGradient}
          >
            <SettingsIcon size={32} color="#ffffff" />
          </LinearGradient>
          <Text style={styles.title}>Paramètres Enhanced</Text>
          <Text style={styles.subtitle}>Configuration du serveur de présentations</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Configuration du serveur</Text>
          <Text style={styles.sectionDescription}>
            Configurez l'adresse de votre serveur et les chemins d'accès
          </Text>

          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>
              <Globe size={16} color="#ffffff" /> Adresse du serveur
            </Text>
            <TextInput
              style={[
                styles.textInput,
                focusedIndex === 0 && styles.focusedInput
              ]}
              value={serverHost}
              onChangeText={setServerHost}
              placeholder="192.168.1.100 ou monserveur.local"
              placeholderTextColor="#6b7280"
              autoCapitalize="none"
              autoCorrect={false}
              keyboardType="url"
              accessible={true}
              accessibilityLabel="Adresse du serveur"
              accessibilityHint="Entrez l'adresse IP ou le nom de domaine de votre serveur"
              onFocus={() => setFocusedIndex(0)}
            />
            <Text style={styles.inputHint}>
              Adresse IP (ex: 192.168.1.100) ou nom de domaine (ex: monserveur.local)
            </Text>
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>
              <Server size={16} color="#ffffff" /> Chemin API
            </Text>
            <TextInput
              style={[
                styles.textInput,
                focusedIndex === 1 && styles.focusedInput
              ]}
              value={apiPath}
              onChangeText={setApiPath}
              placeholder="api/"
              placeholderTextColor="#6b7280"
              autoCapitalize="none"
              autoCorrect={false}
              accessible={true}
              accessibilityLabel="Chemin API"
              accessibilityHint="Chemin vers l'API sur le serveur"
              onFocus={() => setFocusedIndex(1)}
            />
            <Text style={styles.inputHint}>
              Chemin relatif vers l'API (ex: api/, mods/livetv/api/)
            </Text>
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>
              <Folder size={16} color="#ffffff" /> Chemin uploads
            </Text>
            <TextInput
              style={[
                styles.textInput,
                focusedIndex === 2 && styles.focusedInput
              ]}
              value={uploadsPath}
              onChangeText={setUploadsPath}
              placeholder="uploads/"
              placeholderTextColor="#6b7280"
              autoCapitalize="none"
              autoCorrect={false}
              accessible={true}
              accessibilityLabel="Chemin uploads"
              accessibilityHint="Chemin vers le dossier des médias"
              onFocus={() => setFocusedIndex(2)}
            />
            <Text style={styles.inputHint}>
              Chemin relatif vers les médias (ex: uploads/, mods/livetv/uploads/)
            </Text>
          </View>

          {renderConnectionStatus()}

          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={[
                styles.button, 
                styles.testButton,
                (!serverHost.trim() || connectionStatus === 'testing') && styles.buttonDisabled,
                focusedIndex === 3 && styles.focusedButton
              ]}
              onPress={testConnection}
              disabled={!serverHost.trim() || connectionStatus === 'testing'}
              accessible={true}
              accessibilityLabel="Tester la connexion"
              accessibilityRole="button"
              onFocus={() => setFocusedIndex(3)}
            >
              {connectionStatus === 'testing' ? (
                <ActivityIndicator size="small" color="#ffffff" />
              ) : (
                <Wifi size={16} color="#ffffff" />
              )}
              <Text style={styles.buttonText}>Tester la connexion</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.button,
                styles.saveButton,
                (!hasChanges || saving) && styles.buttonDisabled,
                focusedIndex === 4 && styles.focusedButton
              ]}
              onPress={saveSettings}
              disabled={!hasChanges || saving}
              accessible={true}
              accessibilityLabel="Sauvegarder la configuration"
              accessibilityRole="button"
              onFocus={() => setFocusedIndex(4)}
            >
              {saving ? (
                <ActivityIndicator size="small" color="#ffffff" />
              ) : (
                <Check size={16} color="#ffffff" />
              )}
              <Text style={styles.buttonText}>Sauvegarder</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Enregistrement de l'appareil</Text>
          <Text style={styles.sectionDescription}>
            Enregistrez manuellement cet appareil sur le serveur si l'enregistrement automatique a échoué
          </Text>
          
          <TouchableOpacity
            style={[
              styles.button, 
              styles.registerButton,
              registering && styles.buttonDisabled,
              focusedIndex === 5 && styles.focusedButton
            ]}
            onPress={registerDevice}
            disabled={registering}
            accessible={true}
            accessibilityLabel="Enregistrer l'appareil"
            accessibilityRole="button"
            onFocus={() => setFocusedIndex(5)}
          >
            {registering ? (
              <ActivityIndicator size="small" color="#ffffff" />
            ) : (
              <UserPlus size={16} color="#ffffff" />
            )}
            <Text style={styles.buttonText}>
              {registering ? 'Enregistrement...' : 'Enregistrer l\'appareil'}
            </Text>
          </TouchableOpacity>
          
          <Text style={styles.registerHint}>
            Utilisez ce bouton si l'enregistrement automatique a échoué ou si vous voulez forcer un nouvel enregistrement.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Informations de l'appareil</Text>
          
          <View style={styles.infoCard}>
            <View style={styles.infoRow}>
              <Monitor size={20} color="#9ca3af" />
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>Type d'appareil</Text>
                <Text style={styles.infoValue}>Amazon Fire TV Stick Enhanced</Text>
              </View>
            </View>
            
            {debugInfo && (
              <>
                <View style={styles.infoRow}>
                  <Server size={20} color="#9ca3af" />
                  <View style={styles.infoContent}>
                    <Text style={styles.infoLabel}>ID de l'appareil</Text>
                    <Text style={styles.infoValue}>{debugInfo.deviceId}</Text>
                  </View>
                </View>
                
                <View style={styles.infoRow}>
                  <Globe size={20} color="#9ca3af" />
                  <View style={styles.infoContent}>
                    <Text style={styles.infoLabel}>Serveur configuré</Text>
                    <Text style={styles.infoValue}>{debugInfo.serverHost || 'Non configuré'}</Text>
                  </View>
                </View>
                
                <View style={styles.infoRow}>
                  <Folder size={20} color="#9ca3af" />
                  <View style={styles.infoContent}>
                    <Text style={styles.infoLabel}>Chemins configurés</Text>
                    <Text style={styles.infoValue}>
                      API: {debugInfo.apiPath} • Uploads: {debugInfo.uploadsPath}
                    </Text>
                  </View>
                </View>
                
                <View style={styles.infoRow}>
                  <Check size={20} color={debugInfo.isRegistered ? "#10b981" : "#ef4444"} />
                  <View style={styles.infoContent}>
                    <Text style={styles.infoLabel}>Statut d'enregistrement</Text>
                    <Text style={[styles.infoValue, { color: debugInfo.isRegistered ? "#10b981" : "#ef4444" }]}>
                      {debugInfo.isRegistered ? 'Enregistré' : 'Non enregistré'}
                    </Text>
                  </View>
                </View>
                
                <View style={styles.infoRow}>
                  <AlertCircle size={20} color={debugInfo.hasToken ? "#10b981" : "#6b7280"} />
                  <View style={styles.infoContent}>
                    <Text style={styles.infoLabel}>Token d'enrollment</Text>
                    <Text style={styles.infoValue}>
                      {debugInfo.hasToken ? 'Présent' : 'Absent'}
                    </Text>
                  </View>
                </View>

                <View style={styles.infoRow}>
                  <Monitor size={20} color={debugInfo.assignmentCheckEnabled ? "#10b981" : "#6b7280"} />
                  <View style={styles.infoContent}>
                    <Text style={styles.infoLabel}>Surveillance assignations</Text>
                    <Text style={styles.infoValue}>
                      {debugInfo.assignmentCheckEnabled ? 'Active' : 'Inactive'}
                    </Text>
                  </View>
                </View>

                <View style={styles.infoRow}>
                  <Monitor size={20} color={debugInfo.defaultCheckEnabled ? "#10b981" : "#6b7280"} />
                  <View style={styles.infoContent}>
                    <Text style={styles.infoLabel}>Surveillance par défaut</Text>
                    <Text style={styles.infoValue}>
                      {debugInfo.defaultCheckEnabled ? 'Active' : 'Inactive'}
                    </Text>
                  </View>
                </View>
              </>
            )}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Actions</Text>
          
          <TouchableOpacity
            style={[
              styles.button, 
              styles.actionButton,
              focusedIndex === 6 && styles.focusedButton
            ]}
            onPress={() => loadDebugInfo()}
            accessible={true}
            accessibilityLabel="Actualiser les informations"
            accessibilityRole="button"
            onFocus={() => setFocusedIndex(6)}
          >
            <RefreshCw size={16} color="#3b82f6" />
            <Text style={[styles.buttonText, { color: '#3b82f6' }]}>
              Actualiser les informations
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.button, 
              styles.actionButton,
              focusedIndex === 7 && styles.focusedButton
            ]}
            onPress={resetDevice}
            accessible={true}
            accessibilityLabel="Réinitialiser l'appareil"
            accessibilityRole="button"
            onFocus={() => setFocusedIndex(7)}
          >
            <Trash2 size={16} color="#f59e0b" />
            <Text style={[styles.buttonText, { color: '#f59e0b' }]}>
              Réinitialiser l'appareil
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[
              styles.button, 
              styles.resetButton,
              focusedIndex === 8 && styles.focusedButton
            ]}
            onPress={resetSettings}
            accessible={true}
            accessibilityLabel="Réinitialiser les paramètres"
            accessibilityRole="button"
            onFocus={() => setFocusedIndex(8)}
          >
            <AlertCircle size={16} color="#ef4444" />
            <Text style={[styles.buttonText, { color: '#ef4444' }]}>
              Réinitialiser les paramètres
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.helpSection}>
          <Text style={styles.helpTitle}>Guide de configuration Enhanced</Text>
          <Text style={styles.helpText}>
            <Text style={styles.helpBold}>1. Adresse du serveur :</Text>{`\n`}
            Entrez seulement l'IP ou le nom de domaine (ex: 192.168.1.100){`\n`}
            L'application construira automatiquement les URLs complètes{`\n\n`}
            
            <Text style={styles.helpBold}>2. Chemin API :</Text>{`\n`}
            • Par défaut: api/{`\n`}
            • Si votre API est dans un sous-dossier: mods/livetv/api/{`\n`}
            • Si à la racine: laissez vide ou mettez juste /{`\n\n`}
            
            <Text style={styles.helpBold}>3. Chemin uploads :</Text>{`\n`}
            • Par défaut: uploads/{`\n`}
            • Chemin relatif vers vos médias depuis la racine web{`\n`}
            • Exemple: mods/livetv/uploads/{`\n\n`}
            
            <Text style={styles.helpBold}>4. Exemple de configuration :</Text>{`\n`}
            • Serveur: 192.168.1.100{`\n`}
            • API: mods/livetv/api/{`\n`}
            • Uploads: mods/livetv/uploads/{`\n`}
            → URL API: http://192.168.1.100/mods/livetv/api/index.php{`\n`}
            → URL médias: http://192.168.1.100/mods/livetv/uploads/{`\n\n`}
            
            <Text style={styles.helpBold}>5. Test et sauvegarde :</Text>{`\n`}
            • Testez toujours avant de sauvegarder{`\n`}
            • L'enregistrement se fait automatiquement lors de la sauvegarde{`\n`}
            • Utilisez le bouton manuel si l'automatique échoue{`\n\n`}
            
            <Text style={styles.helpBold}>6. En cas de problème :</Text>{`\n`}
            • Vérifiez que l'appareil et le serveur sont sur le même réseau{`\n`}
            • Testez l'URL dans un navigateur web{`\n`}
            • Vérifiez les chemins d'accès sur votre serveur{`\n`}
            • Consultez les logs PHP de votre serveur
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0a0a',
  },
  scrollContent: {
    padding: 20,
  },
  header: {
    alignItems: 'center',
    marginBottom: 32,
  },
  headerGradient: {
    width: 80,
    height: 80,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#9ca3af',
    textAlign: 'center',
  },
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 8,
  },
  sectionDescription: {
    fontSize: 14,
    color: '#9ca3af',
    marginBottom: 16,
    lineHeight: 20,
  },
  inputContainer: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#ffffff',
    marginBottom: 8,
    flexDirection: 'row',
    alignItems: 'center',
  },
  textInput: {
    backgroundColor: '#1a1a1a',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: '#ffffff',
    borderWidth: 2,
    borderColor: '#374151',
    marginBottom: 8,
  },
  // Style pour l'input focalisé avec bordure très visible
  focusedInput: {
    borderColor: '#3b82f6',
    borderWidth: 4,
    backgroundColor: '#1e293b',
    transform: [{ scale: 1.02 }],
    elevation: 8,
    shadowColor: '#3b82f6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  inputHint: {
    fontSize: 12,
    color: '#6b7280',
    fontStyle: 'italic',
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1a1a1a',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    borderWidth: 1,
  },
  statusText: {
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 8,
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  button: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    gap: 8,
    marginBottom: 8,
  },
  testButton: {
    backgroundColor: '#3b82f6',
  },
  saveButton: {
    backgroundColor: '#10b981',
  },
  registerButton: {
    backgroundColor: '#8b5cf6',
    flex: 'none',
    width: '100%',
  },
  actionButton: {
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: '#374151',
  },
  resetButton: {
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: '#ef4444',
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  // Style pour les boutons focalisés avec bordure très visible
  focusedButton: {
    borderWidth: 4,
    borderColor: '#3b82f6',
    transform: [{ scale: 1.05 }],
    elevation: 12,
    shadowColor: '#3b82f6',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
  },
  buttonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
  },
  registerHint: {
    fontSize: 12,
    color: '#9ca3af',
    fontStyle: 'italic',
    marginTop: 8,
    lineHeight: 16,
  },
  infoCard: {
    backgroundColor: '#1a1a1a',
    borderRadius: 8,
    padding: 16,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  infoContent: {
    marginLeft: 12,
    flex: 1,
  },
  infoLabel: {
    fontSize: 12,
    color: '#9ca3af',
    marginBottom: 2,
  },
  infoValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#ffffff',
  },
  helpSection: {
    backgroundColor: '#1a1a1a',
    borderRadius: 8,
    padding: 16,
    marginTop: 16,
  },
  helpTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 12,
  },
  helpText: {
    fontSize: 14,
    color: '#9ca3af',
    lineHeight: 22,
  },
  helpBold: {
    fontWeight: 'bold',
    color: '#ffffff',
  },
});