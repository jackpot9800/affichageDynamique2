import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  Image,
  Alert,
} from 'react-native';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Monitor, Play, Clock, WifiOff, CircleAlert as AlertCircle } from 'lucide-react-native';
import { apiService, Presentation } from '@/services/ApiService';

export default function PresentationsScreen() {
  const [presentations, setPresentations] = useState<Presentation[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadPresentations();
  }, []);

  const loadPresentations = async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('=== LOADING PRESENTATIONS ===');
      console.log('Server URL:', apiService.getServerUrl());
      
      const data = await apiService.getPresentations();
      console.log('Presentations loaded successfully:', data.length);
      
      setPresentations(data);
    } catch (error) {
      console.error('=== ERROR LOADING PRESENTATIONS ===');
      console.error('Error details:', error);
      
      const errorMessage = error instanceof Error ? error.message : 'Erreur inconnue';
      setError(errorMessage);
      
      Alert.alert(
        'Erreur de connexion',
        `Impossible de charger les présentations:\n\n${errorMessage}`,
        [
          { text: 'Paramètres', onPress: () => router.push('/settings') },
          { text: 'Réessayer', onPress: loadPresentations },
        ]
      );
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadPresentations();
    setRefreshing(false);
  };

  const playPresentation = (presentation: Presentation) => {
    console.log('Playing presentation:', presentation.id, presentation.name);
    router.push(`/presentation/${presentation.id}`);
  };

  const renderPresentationItem = ({ item }: { item: Presentation }) => (
    <TouchableOpacity
      style={styles.presentationItem}
      onPress={() => playPresentation(item)}
      activeOpacity={0.8}
    >
      <View style={styles.itemContent}>
        <View style={styles.iconContainer}>
          <LinearGradient
            colors={['#4f46e5', '#7c3aed']}
            style={styles.iconGradient}
          >
            <Monitor size={24} color="#ffffff" />
          </LinearGradient>
        </View>

        <View style={styles.itemDetails}>
          <Text style={styles.itemTitle} numberOfLines={2}>
            {item.name}
          </Text>
          <Text style={styles.itemDescription} numberOfLines={2}>
            {item.description || 'Aucune description disponible'}
          </Text>
          
          <View style={styles.itemMeta}>
            <View style={styles.metaItem}>
              <Monitor size={14} color="#9ca3af" />
              <Text style={styles.metaText}>
                {item.slide_count} slide{item.slide_count > 1 ? 's' : ''}
              </Text>
            </View>
            <View style={styles.metaItem}>
              <Clock size={14} color="#9ca3af" />
              <Text style={styles.metaText}>
                {new Date(item.created_at).toLocaleDateString('fr-FR')}
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.playIconContainer}>
          <Play size={20} color="#3b82f6" fill="#3b82f6" />
        </View>
      </View>
    </TouchableOpacity>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      {!apiService.getServerUrl() ? (
        <>
          <WifiOff size={64} color="#ef4444" />
          <Text style={styles.emptyTitle}>Serveur non configuré</Text>
          <Text style={styles.emptyMessage}>
            Configurez l'URL de votre serveur dans les paramètres.
          </Text>
          <TouchableOpacity
            style={styles.configButton}
            onPress={() => router.push('/settings')}
          >
            <Text style={styles.configButtonText}>Configurer</Text>
          </TouchableOpacity>
        </>
      ) : error ? (
        <>
          <AlertCircle size={64} color="#ef4444" />
          <Text style={styles.emptyTitle}>Erreur de chargement</Text>
          <Text style={styles.emptyMessage}>
            {error}
          </Text>
          <TouchableOpacity
            style={styles.configButton}
            onPress={loadPresentations}
          >
            <Text style={styles.configButtonText}>Réessayer</Text>
          </TouchableOpacity>
        </>
      ) : (
        <>
          <Monitor size={64} color="#6b7280" />
          <Text style={styles.emptyTitle}>Aucune présentation</Text>
          <Text style={styles.emptyMessage}>
            Aucune présentation disponible sur le serveur.
            Créez des présentations depuis votre plateforme web.
          </Text>
        </>
      )}
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Présentations</Text>
        <Text style={styles.subtitle}>
          {error ? 'Erreur de chargement' : 
           `${presentations.length} présentation${presentations.length > 1 ? 's' : ''} disponible${presentations.length > 1 ? 's' : ''}`}
        </Text>
        {apiService.getServerUrl() && (
          <Text style={styles.serverInfo}>
            Serveur: {apiService.getServerUrl()}
          </Text>
        )}
      </View>

      <FlatList
        data={presentations}
        renderItem={renderPresentationItem}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#3b82f6"
          />
        }
        ListEmptyComponent={renderEmptyState}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0a0a',
  },
  header: {
    padding: 20,
    paddingBottom: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    color: '#9ca3af',
    marginBottom: 4,
  },
  serverInfo: {
    fontSize: 12,
    color: '#6b7280',
    fontFamily: 'monospace',
  },
  listContent: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  presentationItem: {
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    marginBottom: 12,
    overflow: 'hidden',
  },
  itemContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  iconContainer: {
    marginRight: 16,
  },
  iconGradient: {
    width: 48,
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  itemDetails: {
    flex: 1,
    marginRight: 12,
  },
  itemTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 4,
  },
  itemDescription: {
    fontSize: 14,
    color: '#9ca3af',
    marginBottom: 8,
    lineHeight: 18,
  },
  itemMeta: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 16,
  },
  metaText: {
    fontSize: 12,
    color: '#9ca3af',
    marginLeft: 4,
  },
  playIconContainer: {
    backgroundColor: 'rgba(59, 130, 246, 0.1)',
    borderRadius: 20,
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 80,
    paddingHorizontal: 40,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#ffffff',
    marginTop: 16,
    marginBottom: 8,
    textAlign: 'center',
  },
  emptyMessage: {
    fontSize: 14,
    color: '#9ca3af',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 16,
  },
  configButton: {
    backgroundColor: '#3b82f6',
    borderRadius: 8,
    paddingHorizontal: 24,
    paddingVertical: 12,
    marginTop: 8,
  },
  configButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
});