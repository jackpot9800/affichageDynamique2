import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEYS = {
  SERVER_HOST: 'server_host',
  API_PATH: 'api_path',
  UPLOADS_PATH: 'uploads_path',
  DEVICE_ID: 'device_id',
  DEVICE_REGISTERED: 'device_registered',
  ENROLLMENT_TOKEN: 'enrollment_token',
  ASSIGNED_PRESENTATION: 'assigned_presentation',
  DEFAULT_PRESENTATION: 'default_presentation',
};

export interface Presentation {
  id: number;
  name?: string;
  nom?: string; // Support pour l'API affichageDynamique
  description: string;
  created_at?: string;
  date_creation?: string; // Support pour l'API affichageDynamique
  slide_count: number;
  preview_url: string;
}

export interface Slide {
  id: number;
  name: string;
  title?: string;
  image_path: string;
  media_path?: string;
  image_url: string;
  duration: number;
  transition_type: string;
}

export interface PresentationDetails extends Presentation {
  slides: Slide[];
}

export interface ApiResponse<T> {
  presentations?: T;
  presentation?: T;
  assigned_presentation?: T;
  default_presentation?: T;
  success?: boolean;
  message?: string;
  device_id?: string;
  token?: string;
}

export interface DeviceRegistration {
  device_id: string;
  name: string;
  type: string;
  platform: string;
  user_agent: string;
  capabilities: string[];
}

export interface AssignedPresentation {
  id: number;
  presentation_id: number;
  presentation_name: string;
  presentation_description: string;
  auto_play: boolean;
  loop_mode: boolean;
  start_time?: string;
  end_time?: string;
  created_at: string;
}

export interface DefaultPresentation {
  presentation_id: number;
  presentation_name: string;
  presentation_description: string;
  slide_count?: number;
  is_default: boolean;
}

export interface ServerConfig {
  host: string;
  apiPath: string;
  uploadsPath: string;
}

class ApiService {
  private serverHost: string = '';
  private apiPath: string = 'api/';
  private uploadsPath: string = 'uploads/';
  private deviceId: string = '';
  private isRegistered: boolean = false;
  private enrollmentToken: string = '';
  private assignmentCheckInterval: NodeJS.Timeout | null = null;
  private defaultCheckInterval: NodeJS.Timeout | null = null;
  private onAssignedPresentationCallback: ((presentation: AssignedPresentation) => void) | null = null;
  private onDefaultPresentationCallback: ((presentation: DefaultPresentation) => void) | null = null;
  private assignmentCheckEnabled: boolean = false;
  private defaultCheckEnabled: boolean = false;
  private apiType: 'standard' | 'affichageDynamique' = 'affichageDynamique'; // Par défaut affichageDynamique

  async initialize() {
    try {
      console.log('=== INITIALIZING API SERVICE ===');
      
      const savedHost = await AsyncStorage.getItem(STORAGE_KEYS.SERVER_HOST);
      const savedApiPath = await AsyncStorage.getItem(STORAGE_KEYS.API_PATH);
      const savedUploadsPath = await AsyncStorage.getItem(STORAGE_KEYS.UPLOADS_PATH);
      const savedDeviceId = await AsyncStorage.getItem(STORAGE_KEYS.DEVICE_ID);
      const savedRegistration = await AsyncStorage.getItem(STORAGE_KEYS.DEVICE_REGISTERED);
      const savedToken = await AsyncStorage.getItem(STORAGE_KEYS.ENROLLMENT_TOKEN);
      
      if (savedHost) {
        this.serverHost = savedHost;
        console.log('Loaded server host:', this.serverHost);
      }
      
      if (savedApiPath) {
        this.apiPath = savedApiPath;
        console.log('Loaded API path:', this.apiPath);
      }
      
      if (savedUploadsPath) {
        this.uploadsPath = savedUploadsPath;
        console.log('Loaded uploads path:', this.uploadsPath);
      }
      
      if (savedDeviceId) {
        this.deviceId = savedDeviceId;
        console.log('Loaded device ID:', this.deviceId);
      } else {
        this.deviceId = this.generateDeviceId();
        await AsyncStorage.setItem(STORAGE_KEYS.DEVICE_ID, this.deviceId);
        console.log('Generated new device ID:', this.deviceId);
      }

      if (savedRegistration === 'true') {
        this.isRegistered = true;
        console.log('Device is already registered');
      }

      if (savedToken) {
        this.enrollmentToken = savedToken;
        console.log('Loaded enrollment token');
      }

      console.log('=== API SERVICE INITIALIZED ===');
      console.log('Server Host:', this.serverHost);
      console.log('API Path:', this.apiPath);
      console.log('Uploads Path:', this.uploadsPath);
      console.log('Device ID:', this.deviceId);
      console.log('Is Registered:', this.isRegistered);
      console.log('API Type:', this.apiType);
      
    } catch (error) {
      console.error('Error initializing API service:', error);
    }
  }

  private generateDeviceId(): string {
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substr(2, 9);
    return `firetv_${timestamp}_${random}`;
  }

  /**
   * Détecte automatiquement le type d'API utilisé
   */
  private async detectApiType(): Promise<void> {
    try {
      console.log('=== DETECTING API TYPE ===');
      
      // Tester d'abord l'API affichageDynamique
      const response = await this.makeRequest<any>('/version');
      
      if (response.database === 'affichageDynamique') {
        this.apiType = 'affichageDynamique';
        console.log('✅ Detected affichageDynamique API');
      } else {
        this.apiType = 'standard';
        console.log('✅ Detected standard API');
      }
    } catch (error) {
      console.log('⚠️ Could not detect API type, using affichageDynamique by default');
      this.apiType = 'affichageDynamique';
    }
  }

  /**
   * Retourne l'endpoint correct selon le type d'API
   */
  private getEndpoint(endpoint: string): string {
    if (this.apiType === 'affichageDynamique') {
      // Mapping des endpoints pour l'API affichageDynamique
      const endpointMapping: { [key: string]: string } = {
        '/device/register': '/appareil/enregistrer',
        '/device/assigned-presentation': '/appareil/presentation-assignee',
        '/device/default-presentation': '/appareil/presentation-defaut',
        '/device/presentation': '/appareil/presentation',
        '/presentations': '/presentations',
        '/presentation': '/presentation',
        '/version': '/version'
      };

      // Gérer les endpoints dynamiques comme /presentation/{id}
      if (endpoint.startsWith('/presentation/') && endpoint.match(/\/presentation\/\d+$/)) {
        return endpoint; // Garder tel quel pour l'API affichageDynamique
      }

      return endpointMapping[endpoint] || endpoint;
    }
    
    return endpoint; // API standard
  }

  /**
   * Démarre la vérification périodique des présentations assignées
   */
  async startAssignmentCheck(callback?: (presentation: AssignedPresentation) => void) {
    if (!this.serverHost || !this.isRegistered) {
      console.log('Cannot start assignment check: not configured or not registered');
      return;
    }

    // Détecter le type d'API d'abord
    await this.detectApiType();

    console.log('=== STARTING ASSIGNMENT CHECK ===');
    console.log('API Type:', this.apiType);
    console.log('Base URL:', this.getBaseUrl());

    // CORRECTION: Activer directement la surveillance pour affichageDynamique
    if (this.apiType === 'affichageDynamique') {
      console.log('✅ Enabling assignment check for affichageDynamique API');
      this.assignmentCheckEnabled = true;
    } else {
      // Pour l'API standard, vérifier si l'endpoint existe
      console.log('=== CHECKING IF ASSIGNMENT ENDPOINT EXISTS (Standard API) ===');
      try {
        const testResponse = await this.makeRequest<any>('/version');
        const assignmentEndpoint = this.getEndpoint('/device/assigned-presentation');
        
        if (testResponse.endpoints && testResponse.endpoints[`GET ${assignmentEndpoint}`]) {
          console.log('✅ Assignment endpoint is available');
          this.assignmentCheckEnabled = true;
        } else {
          console.log('⚠️ Assignment endpoint not available in this API version');
          this.assignmentCheckEnabled = false;
          return;
        }
      } catch (error) {
        console.log('⚠️ Could not verify endpoint availability, disabling assignment check');
        this.assignmentCheckEnabled = false;
        return;
      }
    }

    this.onAssignedPresentationCallback = callback || null;

    // Vérifier immédiatement
    this.checkForAssignedPresentation();

    // Puis vérifier toutes les 15 secondes pour les assignations (plus fréquent)
    this.assignmentCheckInterval = setInterval(async () => {
      try {
        await this.checkForAssignedPresentation();
      } catch (error) {
        console.log('Assignment check failed:', error);
      }
    }, 15000); // 15 secondes pour une réactivité maximale

    console.log('✅ Assignment check started with 15s interval');
  }

  /**
   * Démarre la vérification périodique des présentations par défaut
   */
  async startDefaultPresentationCheck(callback?: (presentation: DefaultPresentation) => void) {
    if (!this.serverHost || !this.isRegistered) {
      console.log('Cannot start default presentation check: not configured or not registered');
      return;
    }

    // Détecter le type d'API d'abord
    await this.detectApiType();

    console.log('=== STARTING DEFAULT PRESENTATION CHECK ===');
    console.log('API Type:', this.apiType);
    console.log('Base URL:', this.getBaseUrl());

    // CORRECTION: Activer directement la surveillance pour affichageDynamique
    if (this.apiType === 'affichageDynamique') {
      console.log('✅ Enabling default presentation check for affichageDynamique API');
      this.defaultCheckEnabled = true;
    } else {
      // Pour l'API standard, vérifier si l'endpoint existe
      console.log('=== CHECKING IF DEFAULT PRESENTATION ENDPOINT EXISTS (Standard API) ===');
      try {
        const testResponse = await this.makeRequest<any>('/version');
        const defaultEndpoint = this.getEndpoint('/device/default-presentation');
        
        if (testResponse.endpoints && testResponse.endpoints[`GET ${defaultEndpoint}`]) {
          console.log('✅ Default presentation endpoint is available');
          this.defaultCheckEnabled = true;
        } else {
          console.log('⚠️ Default presentation endpoint not available in this API version');
          this.defaultCheckEnabled = false;
          return;
        }
      } catch (error) {
        console.log('⚠️ Could not verify endpoint availability, disabling default presentation check');
        this.defaultCheckEnabled = false;
        return;
      }
    }

    this.onDefaultPresentationCallback = callback || null;

    // Vérifier immédiatement
    this.checkForDefaultPresentation();

    // Puis vérifier toutes les 30 secondes pour les présentations par défaut
    this.defaultCheckInterval = setInterval(async () => {
      try {
        await this.checkForDefaultPresentation();
      } catch (error) {
        console.log('Default presentation check failed:', error);
      }
    }, 30000);

    console.log('✅ Default presentation check started with 30s interval');
  }

  /**
   * Arrête la vérification des présentations assignées
   */
  stopAssignmentCheck() {
    if (this.assignmentCheckInterval) {
      clearInterval(this.assignmentCheckInterval);
      this.assignmentCheckInterval = null;
      console.log('Assignment check stopped');
    }
    this.assignmentCheckEnabled = false;
  }

  /**
   * Arrête la vérification des présentations par défaut
   */
  stopDefaultPresentationCheck() {
    if (this.defaultCheckInterval) {
      clearInterval(this.defaultCheckInterval);
      this.defaultCheckInterval = null;
      console.log('Default presentation check stopped');
    }
    this.defaultCheckEnabled = false;
  }

  /**
   * Vérifie s'il y a une présentation assignée à cet appareil
   */
  async checkForAssignedPresentation(): Promise<AssignedPresentation | null> {
    try {
      if (!this.serverHost || !this.isRegistered || !this.assignmentCheckEnabled) {
        console.log('Assignment check disabled or not ready');
        return null;
      }

      console.log('=== CHECKING FOR ASSIGNED PRESENTATION ===');
      const endpoint = this.getEndpoint('/device/assigned-presentation');
      console.log('Using endpoint:', endpoint);
      console.log('API Type:', this.apiType);
      
      const response = await this.makeRequest<ApiResponse<AssignedPresentation>>(endpoint);
      const assignedPresentation = response.assigned_presentation;

      if (assignedPresentation) {
        console.log('✅ Found assigned presentation:', {
          presentation_id: assignedPresentation.presentation_id,
          auto_play: assignedPresentation.auto_play,
          loop_mode: assignedPresentation.loop_mode
        });
        
        // Sauvegarder localement
        await AsyncStorage.setItem(STORAGE_KEYS.ASSIGNED_PRESENTATION, JSON.stringify(assignedPresentation));
        
        // Déclencher le callback si défini
        if (this.onAssignedPresentationCallback) {
          this.onAssignedPresentationCallback(assignedPresentation);
        }
        
        return assignedPresentation;
      } else {
        console.log('No assigned presentation found');
        // Supprimer l'assignation locale si elle n'existe plus
        await AsyncStorage.removeItem(STORAGE_KEYS.ASSIGNED_PRESENTATION);
        return null;
      }
    } catch (error) {
      // Gérer spécifiquement l'erreur d'endpoint non trouvé
      if (error instanceof Error) {
        if (error.message.includes('Endpoint not found') || error.message.includes('404')) {
          console.log('⚠️ Assignment endpoint not available on this server version - disabling assignment check');
          this.assignmentCheckEnabled = false;
          this.stopAssignmentCheck();
          return null;
        }
      }
      
      console.log('Assignment check failed:', error);
      return null;
    }
  }

  /**
   * Vérifie s'il y a une présentation par défaut pour cet appareil
   */
  async checkForDefaultPresentation(): Promise<DefaultPresentation | null> {
    try {
      if (!this.serverHost || !this.isRegistered || !this.defaultCheckEnabled) {
        console.log('Default presentation check disabled or not ready');
        return null;
      }

      console.log('=== CHECKING FOR DEFAULT PRESENTATION ===');
      const endpoint = this.getEndpoint('/device/default-presentation');
      console.log('Using endpoint:', endpoint);
      console.log('Device ID:', this.deviceId);
      console.log('API Type:', this.apiType);
      
      const response = await this.makeRequest<ApiResponse<DefaultPresentation>>(endpoint);
      
      console.log('=== DEFAULT PRESENTATION RESPONSE ===');
      console.log('Full response:', response);
      
      const defaultPresentation = response.default_presentation;

      if (defaultPresentation && defaultPresentation.presentation_id) {
        console.log('✅ Found default presentation:', {
          presentation_id: defaultPresentation.presentation_id,
          presentation_name: defaultPresentation.presentation_name,
          is_default: defaultPresentation.is_default
        });
        
        // Sauvegarder localement
        await AsyncStorage.setItem(STORAGE_KEYS.DEFAULT_PRESENTATION, JSON.stringify(defaultPresentation));
        
        // Déclencher le callback si défini
        if (this.onDefaultPresentationCallback) {
          this.onDefaultPresentationCallback(defaultPresentation);
        }
        
        return defaultPresentation;
      } else {
        console.log('❌ No default presentation found or invalid data');
        console.log('Response data:', defaultPresentation);
        // Supprimer la présentation par défaut locale si elle n'existe plus
        await AsyncStorage.removeItem(STORAGE_KEYS.DEFAULT_PRESENTATION);
        return null;
      }
    } catch (error) {
      // Gérer spécifiquement l'erreur d'endpoint non trouvé
      if (error instanceof Error) {
        if (error.message.includes('Endpoint not found') || error.message.includes('404')) {
          console.log('⚠️ Default presentation endpoint not available on this server version - disabling default presentation check');
          this.defaultCheckEnabled = false;
          this.stopDefaultPresentationCheck();
          return null;
        }
      }
      
      console.log('Default presentation check failed:', error);
      return null;
    }
  }

  /**
   * Récupère l'assignation en cours localement
   */
  async getLocalAssignedPresentation(): Promise<AssignedPresentation | null> {
    try {
      const stored = await AsyncStorage.getItem(STORAGE_KEYS.ASSIGNED_PRESENTATION);
      return stored ? JSON.parse(stored) : null;
    } catch (error) {
      console.error('Error getting local assigned presentation:', error);
      return null;
    }
  }

  /**
   * Récupère la présentation par défaut localement
   */
  async getLocalDefaultPresentation(): Promise<DefaultPresentation | null> {
    try {
      const stored = await AsyncStorage.getItem(STORAGE_KEYS.DEFAULT_PRESENTATION);
      return stored ? JSON.parse(stored) : null;
    } catch (error) {
      console.error('Error getting local default presentation:', error);
      return null;
    }
  }

  /**
   * Marque une présentation assignée comme vue
   */
  async markAssignedPresentationAsViewed(presentationId: number): Promise<boolean> {
    try {
      if (!this.assignmentCheckEnabled) {
        console.log('Assignment features not available');
        return false;
      }
      
      const endpoint = `/appareil/presentation/${presentationId}/vue`; // Endpoint affichageDynamique
      const response = await this.makeRequest<{ success: boolean }>(endpoint, {
        method: 'POST',
      });
      return response.success || false;
    } catch (error) {
      console.log('Error marking presentation as viewed (endpoint may not exist):', error);
      return false;
    }
  }

  /**
   * Debug de l'appareil via l'API
   */
  async debugDevice(): Promise<any> {
    try {
      if (!this.serverHost || !this.deviceId) {
        return {
          error: 'Device not configured',
          deviceId: this.deviceId,
          serverHost: this.serverHost,
          apiPath: this.apiPath,
          uploadsPath: this.uploadsPath
        };
      }

      console.log('=== DEBUGGING DEVICE VIA API ===');
      const response = await this.makeRequest<any>(`/debug/appareil/${this.deviceId}`);
      return response;
    } catch (error) {
      console.log('Debug endpoint not available:', error);
      return {
        error: 'Debug endpoint not available',
        deviceId: this.deviceId,
        serverHost: this.serverHost,
        apiPath: this.apiPath,
        uploadsPath: this.uploadsPath,
        isRegistered: this.isRegistered,
        assignmentCheckEnabled: this.assignmentCheckEnabled,
        defaultCheckEnabled: this.defaultCheckEnabled,
        apiType: this.apiType
      };
    }
  }

  async setServerConfig(config: ServerConfig): Promise<boolean> {
    try {
      console.log('=== SETTING SERVER CONFIG ===');
      console.log('Input config:', config);
      
      // Nettoyer et valider la configuration
      let cleanHost = config.host.replace(/\/+$/, '');
      let cleanApiPath = config.apiPath.replace(/^\/+|\/+$/g, '') + '/';
      let cleanUploadsPath = config.uploadsPath.replace(/^\/+|\/+$/g, '') + '/';
      
      // S'assurer que le host commence par http:// ou https://
      if (!cleanHost.startsWith('http://') && !cleanHost.startsWith('https://')) {
        cleanHost = 'http://' + cleanHost;
      }
      
      console.log('Clean config:', {
        host: cleanHost,
        apiPath: cleanApiPath,
        uploadsPath: cleanUploadsPath
      });
      
      this.serverHost = cleanHost;
      this.apiPath = cleanApiPath;
      this.uploadsPath = cleanUploadsPath;
      
      await AsyncStorage.setItem(STORAGE_KEYS.SERVER_HOST, cleanHost);
      await AsyncStorage.setItem(STORAGE_KEYS.API_PATH, cleanApiPath);
      await AsyncStorage.setItem(STORAGE_KEYS.UPLOADS_PATH, cleanUploadsPath);
      
      // Réinitialiser le statut d'enregistrement pour le nouveau serveur
      this.isRegistered = false;
      this.enrollmentToken = '';
      this.assignmentCheckEnabled = false;
      this.defaultCheckEnabled = false;
      this.apiType = 'affichageDynamique'; // Par défaut affichageDynamique
      await AsyncStorage.removeItem(STORAGE_KEYS.DEVICE_REGISTERED);
      await AsyncStorage.removeItem(STORAGE_KEYS.ENROLLMENT_TOKEN);
      await AsyncStorage.removeItem(STORAGE_KEYS.ASSIGNED_PRESENTATION);
      await AsyncStorage.removeItem(STORAGE_KEYS.DEFAULT_PRESENTATION);
      
      // Arrêter les anciens checks
      this.stopAssignmentCheck();
      this.stopDefaultPresentationCheck();
      
      // Détecter le type d'API
      await this.detectApiType();
      
      // Tester la connexion
      const connectionOk = await this.testConnection();
      if (connectionOk) {
        // Enregistrer l'appareil
        const registrationOk = await this.registerDevice();
        if (registrationOk) {
          console.log('=== SERVER SETUP COMPLETE ===');
          return true;
        } else {
          console.warn('Connection OK but registration failed');
          return true; // On continue même si l'enregistrement échoue
        }
      }
      
      console.error('Connection test failed');
      return false;
    } catch (error) {
      console.error('Error setting server config:', error);
      return false;
    }
  }

  getServerConfig(): ServerConfig {
    return {
      host: this.serverHost,
      apiPath: this.apiPath,
      uploadsPath: this.uploadsPath
    };
  }

  getDeviceId(): string {
    return this.deviceId;
  }

  isDeviceRegistered(): boolean {
    return this.isRegistered;
  }

  /**
   * Construit l'URL complète de l'API
   */
  private getBaseUrl(): string {
    if (!this.serverHost) return '';
    return `${this.serverHost}/${this.apiPath}index.php`;
  }

  /**
   * Construit l'URL de base du serveur pour les images
   */
  private getBaseServerUrl(): string {
    if (!this.serverHost) return '';
    return this.serverHost;
  }

  /**
   * Nettoie une réponse PHP de manière robuste
   */
  private cleanPhpResponse(responseText: string): string {
    console.log('=== CLEANING PHP RESPONSE ===');
    console.log('Original length:', responseText.length);
    console.log('First 500 chars:', responseText.substring(0, 500));
    
    let cleanedResponse = responseText.trim();
    
    // 1. Chercher d'abord un JSON valide dans la réponse
    const jsonMatches = cleanedResponse.match(/\{[\s\S]*\}/);
    if (jsonMatches && jsonMatches.length > 0) {
      const potentialJson = jsonMatches[0];
      try {
        // Tester si c'est du JSON valide
        JSON.parse(potentialJson);
        console.log('Found valid JSON in response');
        return potentialJson;
      } catch (e) {
        console.log('Found JSON-like text but invalid JSON, continuing with cleaning...');
      }
    }
    
    // 2. Si pas de JSON trouvé, nettoyer les erreurs PHP
    const phpErrorPatterns = [
      /<br\s*\/?>\s*<b>Warning<\/b>:.*?<br\s*\/?>/gi,
      /<br\s*\/?>\s*<b>Notice<\/b>:.*?<br\s*\/?>/gi,
      /<br\s*\/?>\s*<b>Fatal error<\/b>:.*?<br\s*\/?>/gi,
      /<br\s*\/?>\s*<b>Parse error<\/b>:.*?<br\s*\/?>/gi,
      /Warning:.*?in.*?on line.*?\n/gi,
      /Notice:.*?in.*?on line.*?\n/gi,
      /Fatal error:.*?in.*?on line.*?\n/gi,
      /Parse error:.*?in.*?on line.*?\n/gi,
      /<br\s*\/?>\s*<b>[^<]*<\/b>:\s*[^<]*<br\s*\/?>/gi,
      /(<br\s*\/?>){2,}/gi,
    ];
    
    let foundErrors = [];
    
    // Supprimer chaque type d'erreur PHP
    phpErrorPatterns.forEach((pattern, index) => {
      const matches = cleanedResponse.match(pattern);
      if (matches) {
        foundErrors.push(`Pattern ${index + 1}: ${matches.length} matches`);
        cleanedResponse = cleanedResponse.replace(pattern, '');
      }
    });
    
    // Supprimer les <br> orphelins et espaces
    cleanedResponse = cleanedResponse
      .replace(/^(\s*<br\s*\/?>)+/gi, '')
      .replace(/(\s*<br\s*\/?>)+$/gi, '')
      .trim();
    
    if (foundErrors.length > 0) {
      console.log('=== PHP ERRORS CLEANED ===');
      console.log('Errors found and removed:', foundErrors);
    }
    
    return cleanedResponse;
  }

  /**
   * Extraction JSON avec gestion d'erreurs améliorée
   */
  private extractJsonFromResponse(responseText: string): any {
    console.log('=== EXTRACTING JSON FROM RESPONSE ===');
    
    // Nettoyer d'abord les erreurs PHP
    let cleanedResponse = this.cleanPhpResponse(responseText);
    
    // Si la réponse est vide après nettoyage
    if (!cleanedResponse.trim()) {
      throw new Error('Réponse vide après suppression des erreurs PHP');
    }
    
    // Vérifier si c'est une page d'erreur HTML complète
    if (cleanedResponse.includes('<!DOCTYPE') || cleanedResponse.includes('<html')) {
      console.error('Response is a full HTML page:', cleanedResponse.substring(0, 200));
      
      // Essayer d'extraire des informations utiles de la page d'erreur
      if (cleanedResponse.includes('404') || cleanedResponse.includes('Not Found')) {
        throw new Error('Endpoint non trouvé (404). Vérifiez que votre API est correctement configurée.');
      } else if (cleanedResponse.includes('500') || cleanedResponse.includes('Internal Server Error')) {
        throw new Error('Erreur serveur interne (500). Vérifiez les logs PHP de votre serveur.');
      } else if (cleanedResponse.includes('403') || cleanedResponse.includes('Forbidden')) {
        throw new Error('Accès interdit (403). Vérifiez les permissions de votre serveur.');
      } else {
        throw new Error('Le serveur a retourné une page HTML au lieu de JSON.');
      }
    }
    
    // Vérifier si ça commence encore par du HTML après nettoyage
    if (cleanedResponse.trim().startsWith('<')) {
      console.error('Still HTML after cleaning:', cleanedResponse.substring(0, 300));
      throw new Error('La réponse contient encore du HTML après nettoyage.');
    }
    
    try {
      const jsonData = JSON.parse(cleanedResponse);
      console.log('=== JSON PARSED SUCCESSFULLY ===');
      console.log('Data keys:', Object.keys(jsonData));
      return jsonData;
    } catch (parseError) {
      console.error('=== JSON PARSE ERROR ===');
      console.error('Parse error:', parseError);
      console.error('Cleaned response:', cleanedResponse.substring(0, 500));
      
      let errorHint = '';
      if (cleanedResponse.includes('<?php')) {
        errorHint = '\n\nIl semble que le code PHP ne soit pas exécuté.';
      } else if (cleanedResponse.includes('Endpoint not found')) {
        errorHint = '\n\nL\'endpoint demandé n\'existe pas.';
      } else if (cleanedResponse.includes('Database')) {
        errorHint = '\n\nErreur de base de données.';
      }
      
      throw new Error(`Réponse du serveur invalide${errorHint}\n\nRéponse: ${cleanedResponse.substring(0, 200)}...`);
    }
  }

  /**
   * Crée un timeout manuel
   */
  private createTimeoutPromise(timeoutMs: number): Promise<never> {
    return new Promise((_, reject) => {
      setTimeout(() => {
        reject(new Error(`Timeout après ${timeoutMs}ms`));
      }, timeoutMs);
    });
  }

  /**
   * Effectue une requête avec timeout manuel et configuration réseau améliorée pour APK
   */
  private async fetchWithTimeout(url: string, options: RequestInit, timeoutMs: number = 30000): Promise<Response> {
    // Configuration spéciale pour APK compilée
    const enhancedOptions: RequestInit = {
      ...options,
      // Forcer l'utilisation de HTTP/1.1 pour éviter les problèmes de certificats
      // et améliorer la compatibilité avec les serveurs PHP
      headers: {
        ...options.headers,
        'Connection': 'keep-alive',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
      },
    };

    const fetchPromise = fetch(url, enhancedOptions);
    const timeoutPromise = this.createTimeoutPromise(timeoutMs);
    
    return Promise.race([fetchPromise, timeoutPromise]);
  }

  private async makeRequest<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    if (!this.serverHost) {
      throw new Error('Configuration serveur non définie');
    }

    // Construire l'URL correctement avec le bon endpoint
    const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
    const finalEndpoint = this.getEndpoint(cleanEndpoint);
    const url = `${this.getBaseUrl()}${finalEndpoint}`;
    
    console.log('=== API REQUEST ===');
    console.log('Original endpoint:', cleanEndpoint);
    console.log('Final endpoint:', finalEndpoint);
    console.log('URL:', url);
    console.log('Method:', options.method || 'GET');
    console.log('Device ID:', this.deviceId);
    console.log('API Type:', this.apiType);
    
    // Headers améliorés pour APK compilée
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'Pragma': 'no-cache',
      'User-Agent': 'PresentationKiosk/2.0 (Android; FireTV)',
      'X-Device-ID': this.deviceId,
      'X-Device-Type': 'firetv',
      'X-App-Version': '2.0.0',
      'X-Platform': 'android',
      'Connection': 'keep-alive',
      ...options.headers,
    };

    if (this.enrollmentToken) {
      headers['X-Enrollment-Token'] = this.enrollmentToken;
    }

    if (this.isRegistered) {
      headers['X-Device-Registered'] = 'true';
    }
    
    try {
      const response = await this.fetchWithTimeout(url, {
        ...options,
        headers,
      }, 30000);

      console.log('=== API RESPONSE ===');
      console.log('Status:', response.status, response.statusText);

      const responseText = await response.text();
      console.log('=== RAW RESPONSE ===');
      console.log('Length:', responseText.length);
      console.log('First 1000 chars:', responseText.substring(0, 1000));

      if (!response.ok) {
        console.error('=== HTTP ERROR ===');
        console.error('Status:', response.status);
        console.error('Response:', responseText);
        
        if (response.status === 500) {
          throw new Error('Erreur serveur interne (500). Vérifiez les logs PHP de votre serveur.');
        } else if (response.status === 404) {
          try {
            const errorData = this.extractJsonFromResponse(responseText);
            if (errorData.available_endpoints) {
              const endpointsList = Object.keys(errorData.available_endpoints).join(', ');
              throw new Error(`Endpoint non trouvé: ${finalEndpoint}\n\nEndpoints disponibles: ${endpointsList}`);
            }
          } catch (parseError) {
            // Si on ne peut pas parser le JSON d'erreur, utiliser un message générique
          }
          throw new Error(`Endpoint non trouvé: ${url}`);
        } else {
          throw new Error(`Erreur HTTP ${response.status}: ${response.statusText}`);
        }
      }

      if (!responseText.trim()) {
        throw new Error('Réponse vide du serveur');
      }

      return this.extractJsonFromResponse(responseText);

    } catch (error) {
      if (error instanceof Error) {
        if (error.message.includes('Timeout après')) {
          throw new Error(`Timeout de connexion: ${url}`);
        } else if (error.message.includes('fetch') || error.message.includes('Network')) {
          throw new Error(`Impossible de se connecter au serveur: ${url}\n\nVérifiez que votre appareil est connecté au même réseau que le serveur.`);
        }
      }
      throw error;
    }
  }

  async testConnection(): Promise<boolean> {
    try {
      console.log('=== TESTING CONNECTION ===');
      const response = await this.makeRequest<any>('/version');
      console.log('Connection test response:', response);
      
      const isConnected = response.status === 'running' || 
                         response.api_status === 'running' || 
                         response.version !== undefined ||
                         response.database === 'affichageDynamique';
      
      console.log('Connection test result:', isConnected);
      
      // Détecter le type d'API lors du test de connexion
      if (isConnected) {
        await this.detectApiType();
      }
      
      return isConnected;
    } catch (error) {
      console.error('Connection test failed:', error);
      return false;
    }
  }

  async registerDevice(): Promise<boolean> {
    try {
      console.log('=== REGISTERING DEVICE ===');
      console.log('Device ID:', this.deviceId);
      console.log('Server URL:', this.getBaseUrl());
      console.log('API Type:', this.apiType);
      
      const deviceInfo: DeviceRegistration = {
        device_id: this.deviceId,
        name: `Fire TV Stick - ${this.deviceId.split('_').pop()}`,
        type: 'firetv',
        platform: 'android',
        user_agent: 'PresentationKiosk/2.0 (Android; FireTV)',
        capabilities: [
          'video_playback',
          'image_display',
          'remote_control',
          'presentation_mode',
          'fullscreen',
          'auto_play',
          'loop_mode',
          'wake_lock'
        ]
      };

      console.log('=== DEVICE INFO TO REGISTER ===');
      console.log('Device info:', deviceInfo);

      const endpoint = this.getEndpoint('/device/register');
      console.log('Using registration endpoint:', endpoint);

      const response = await this.makeRequest<ApiResponse<any>>(endpoint, {
        method: 'POST',
        body: JSON.stringify(deviceInfo),
      });

      console.log('=== REGISTRATION RESPONSE ===');
      console.log('Response:', response);

      if (response.success !== false) {
        this.isRegistered = true;
        await AsyncStorage.setItem(STORAGE_KEYS.DEVICE_REGISTERED, 'true');
        
        if (response.token) {
          this.enrollmentToken = response.token;
          await AsyncStorage.setItem(STORAGE_KEYS.ENROLLMENT_TOKEN, response.token);
        }

        console.log('=== DEVICE REGISTERED SUCCESSFULLY ===');
        console.log('Device ID:', this.deviceId);
        console.log('Token:', response.token);
        return true;
      } else {
        console.warn('Registration failed:', response.message);
        throw new Error(response.message || 'L\'enregistrement a échoué');
      }
    } catch (error) {
      console.error('=== DEVICE REGISTRATION FAILED ===');
      console.error('Error details:', error);
      
      if (error instanceof Error && error.message.includes('Endpoint not found')) {
        console.log('Registration endpoint not available - continuing without registration');
        this.isRegistered = true;
        await AsyncStorage.setItem(STORAGE_KEYS.DEVICE_REGISTERED, 'true');
        return true;
      }
      
      // Relancer l'erreur pour que l'interface utilisateur puisse l'afficher
      throw error;
    }
  }

  async getPresentations(): Promise<Presentation[]> {
    try {
      console.log('=== FETCHING PRESENTATIONS ===');
      
      if (!this.isRegistered) {
        console.log('Device not registered, attempting registration...');
        const registered = await this.registerDevice();
        if (!registered) {
          console.warn('Registration failed, continuing anyway...');
        }
      }
      
      const response = await this.makeRequest<ApiResponse<Presentation[]>>('/presentations');
      const presentations = response.presentations || [];
      
      // Valider et nettoyer les données avec support pour les deux APIs
      const cleanedPresentations = presentations.map(pres => ({
        ...pres,
        name: pres.name || pres.nom || 'Présentation sans nom',
        created_at: pres.created_at || pres.date_creation || new Date().toISOString(),
        slide_count: parseInt(pres.slide_count?.toString() || '0'),
        description: pres.description || 'Aucune description disponible'
      }));
      
      console.log('Cleaned presentations:', cleanedPresentations.length);
      return cleanedPresentations;
    } catch (error) {
      console.error('=== ERROR FETCHING PRESENTATIONS ===');
      console.error('Error details:', error);
      throw error;
    }
  }

  async getPresentation(id: number): Promise<PresentationDetails> {
    try {
      console.log('=== FETCHING PRESENTATION DETAILS ===');
      console.log('Presentation ID:', id);
      
      if (!this.isRegistered) {
        console.log('Device not registered, attempting registration...');
        const registered = await this.registerDevice();
        if (!registered) {
          console.warn('Registration failed, continuing anyway...');
        }
      }
      
      const response = await this.makeRequest<ApiResponse<PresentationDetails>>(`/presentation/${id}`);
      
      if (!response.presentation) {
        throw new Error('Présentation non trouvée dans la réponse du serveur');
      }

      const presentation = response.presentation;
      
      // Valider les slides
      if (!presentation.slides || !Array.isArray(presentation.slides)) {
        console.warn('No slides found, presentation data:', presentation);
        throw new Error('Aucune slide trouvée pour cette présentation');
      }

      // Valider et nettoyer les slides avec les vraies durées
      const validSlides = presentation.slides.filter(slide => {
        if (!slide.image_url && !slide.image_path && !slide.media_path) {
          console.warn('Slide sans image:', slide);
          return false;
        }
        return true;
      }).map(slide => {
        // Construire correctement l'URL de l'image
        let imageUrl = slide.image_url;
        
        if (!imageUrl) {
          const imagePath = slide.image_path || slide.media_path || '';
          if (imagePath) {
            imageUrl = this.buildImageUrl(imagePath);
          }
        }
        
        if (imageUrl && this.serverHost) {
          const baseServerUrl = this.getBaseServerUrl();
          const imagePath = slide.media_path || slide.image_path || '';
          
          if (imagePath) {
            if (imagePath.includes(this.uploadsPath)) {
              imageUrl = `${baseServerUrl}/${imagePath}`;
            } else {
              imageUrl = `${baseServerUrl}/${this.uploadsPath}${imagePath}`;
            }
          }
        }
        
        // Utiliser la vraie durée de la base de données
        const duration = parseInt(slide.duration?.toString() || '5');
        
        console.log('=== SLIDE DURATION DEBUG ===');
        console.log('Slide ID:', slide.id);
        console.log('Raw duration from DB:', slide.duration);
        console.log('Parsed duration:', duration);
        
        return {
          ...slide,
          duration: duration,
          image_url: imageUrl || this.buildImageUrl(slide.image_path || slide.media_path || ''),
          transition_type: slide.transition_type || 'fade',
          name: slide.name || slide.title || `Slide ${slide.id}`
        };
      });

      if (validSlides.length === 0) {
        throw new Error('Aucune slide valide trouvée pour cette présentation');
      }

      console.log('=== VALID SLIDES WITH DURATIONS ===');
      console.log('Count:', validSlides.length);
      validSlides.forEach((slide, index) => {
        console.log(`Slide ${index + 1}:`, {
          id: slide.id,
          name: slide.name,
          duration: slide.duration,
          image_url: slide.image_url
        });
      });

      // Support pour les deux APIs
      const finalPresentation = {
        ...presentation,
        name: presentation.name || presentation.nom || 'Présentation sans nom',
        created_at: presentation.created_at || presentation.date_creation || new Date().toISOString(),
        slides: validSlides,
        slide_count: validSlides.length
      };

      return finalPresentation;
    } catch (error) {
      console.error('=== ERROR FETCHING PRESENTATION ===');
      console.error('Error details:', error);
      throw error;
    }
  }

  private buildImageUrl(imagePath: string): string {
    if (!imagePath) return '';
    
    if (imagePath.startsWith('http')) {
      return imagePath;
    }
    
    const baseServerUrl = this.getBaseServerUrl();
    
    if (imagePath.includes(this.uploadsPath)) {
      return `${baseServerUrl}/${imagePath}`;
    } else {
      return `${baseServerUrl}/${this.uploadsPath}${imagePath}`;
    }
  }

  async getDebugInfo(): Promise<{
    serverHost: string;
    apiPath: string;
    uploadsPath: string;
    deviceId: string;
    isRegistered: boolean;
    hasToken: boolean;
    assignmentCheckActive: boolean;
    assignmentCheckEnabled: boolean;
    defaultCheckActive: boolean;
    defaultCheckEnabled: boolean;
    apiType: string;
  }> {
    return {
      serverHost: this.serverHost,
      apiPath: this.apiPath,
      uploadsPath: this.uploadsPath,
      deviceId: this.deviceId,
      isRegistered: this.isRegistered,
      hasToken: !!this.enrollmentToken,
      assignmentCheckActive: !!this.assignmentCheckInterval,
      assignmentCheckEnabled: this.assignmentCheckEnabled,
      defaultCheckActive: !!this.defaultCheckInterval,
      defaultCheckEnabled: this.defaultCheckEnabled,
      apiType: this.apiType
    };
  }

  async resetDevice(): Promise<void> {
    console.log('=== RESETTING DEVICE ===');
    
    this.stopAssignmentCheck();
    this.stopDefaultPresentationCheck();
    
    this.isRegistered = false;
    this.enrollmentToken = '';
    this.assignmentCheckEnabled = false;
    this.defaultCheckEnabled = false;
    this.apiType = 'affichageDynamique';
    
    await AsyncStorage.removeItem(STORAGE_KEYS.DEVICE_REGISTERED);
    await AsyncStorage.removeItem(STORAGE_KEYS.ENROLLMENT_TOKEN);
    await AsyncStorage.removeItem(STORAGE_KEYS.ASSIGNED_PRESENTATION);
    await AsyncStorage.removeItem(STORAGE_KEYS.DEFAULT_PRESENTATION);
    
    console.log('Device reset complete');
  }
}

export const apiService = new ApiService();