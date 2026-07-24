import React from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
} from 'react-native';
import { useQuery, gql } from '@apollo/client';

const QUERY_ALERTS_STATS = gql`
  query GetAlertStats($obra_id: String!) {
    alertStats(obra_id: $obra_id) {
      obra_id
      total_alerts
      patterns {
        temporal {
          count
          avg_confidence
        }
        causal {
          count
          avg_confidence
        }
        cascade {
          count
          avg_confidence
        }
        resource {
          count
          avg_confidence
        }
      }
      effectiveness {
        avg_score
        implementations
        success_rate
      }
    }
  }
`;

export function DashboardScreen({ navigation }: any) {
  const [obraId, setObraId] = React.useState('OBRA-2026-001');

  const { data, loading, error, refetch } = useQuery(QUERY_ALERTS_STATS, {
    variables: { obra_id: obraId },
  });

  const stats = data?.alertStats;

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <Text style={styles.loadingText}>Carregando dados...</Text>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={styles.container}>
        <Text style={styles.errorText}>Erro ao carregar: {error.message}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={() => refetch()}>
          <Text style={styles.retryButtonText}>Tentar Novamente</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>🧠 Buildly Brain</Text>
          <Text style={styles.headerSubtitle}>Dashboard de Alertas</Text>
        </View>

        {/* Obra Info */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Obra ID</Text>
          <Text style={styles.obraId}>{obraId}</Text>
        </View>

        {/* Main Stats */}
        {stats && (
          <>
            {/* Total Alerts */}
            <View style={styles.statsRow}>
              <View style={[styles.statBox, { backgroundColor: '#e8eaf6' }]}>
                <Text style={styles.statNumber}>{stats.total_alerts}</Text>
                <Text style={styles.statLabel}>Alertas</Text>
              </View>

              <View style={[styles.statBox, { backgroundColor: '#f3e5f5' }]}>
                <Text style={styles.statNumber}>
                  {(stats.effectiveness.success_rate * 100).toFixed(0)}%
                </Text>
                <Text style={styles.statLabel}>Efetividade</Text>
              </View>
            </View>

            {/* Patterns */}
            <View style={styles.card}>
              <Text style={styles.cardTitle}>📊 Padrões Detectados</Text>

              <View style={styles.patternRow}>
                <View style={styles.patternItem}>
                  <Text style={styles.patternEmoji}>🕐</Text>
                  <Text style={styles.patternType}>Temporal</Text>
                  <Text style={styles.patternCount}>{stats.patterns.temporal.count}</Text>
                </View>

                <View style={styles.patternItem}>
                  <Text style={styles.patternEmoji}>⛓️</Text>
                  <Text style={styles.patternType}>Causal</Text>
                  <Text style={styles.patternCount}>{stats.patterns.causal.count}</Text>
                </View>

                <View style={styles.patternItem}>
                  <Text style={styles.patternEmoji}>🌊</Text>
                  <Text style={styles.patternType}>Cascade</Text>
                  <Text style={styles.patternCount}>{stats.patterns.cascade.count}</Text>
                </View>

                <View style={styles.patternItem}>
                  <Text style={styles.patternEmoji}>📦</Text>
                  <Text style={styles.patternType}>Resource</Text>
                  <Text style={styles.patternCount}>{stats.patterns.resource.count}</Text>
                </View>
              </View>
            </View>

            {/* Effectiveness */}
            <View style={styles.card}>
              <Text style={styles.cardTitle}>✨ Efetividade de Recomendações</Text>

              <View style={styles.effectivenessRow}>
                <View style={styles.effectivenessItem}>
                  <Text style={styles.effectivenessLabel}>Score Médio</Text>
                  <Text style={styles.effectivenessValue}>
                    {(stats.effectiveness.avg_score * 100).toFixed(0)}%
                  </Text>
                </View>

                <View style={styles.effectivenessItem}>
                  <Text style={styles.effectivenessLabel}>Implementadas</Text>
                  <Text style={styles.effectivenessValue}>
                    {stats.effectiveness.implementations}
                  </Text>
                </View>
              </View>
            </View>

            {/* Action Buttons */}
            <View style={styles.buttonRow}>
              <TouchableOpacity
                style={[styles.button, styles.buttonPrimary]}
                onPress={() => navigation.navigate('Alerts')}
              >
                <Text style={styles.buttonText}>Ver Alertas</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.button, styles.buttonSecondary]}
                onPress={() => refetch()}
              >
                <Text style={styles.buttonText}>Atualizar</Text>
              </TouchableOpacity>
            </View>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  scrollContent: {
    padding: 15,
    paddingBottom: 30,
  },
  header: {
    marginBottom: 20,
    paddingBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#999',
    marginTop: 5,
  },
  card: {
    backgroundColor: '#f9f9f9',
    borderRadius: 10,
    padding: 15,
    marginBottom: 15,
    borderLeftWidth: 4,
    borderLeftColor: '#667eea',
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#667eea',
    marginBottom: 10,
  },
  obraId: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  statsRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 15,
  },
  statBox: {
    flex: 1,
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#667eea',
  },
  statLabel: {
    fontSize: 12,
    color: '#999',
    marginTop: 5,
  },
  patternRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
  },
  patternItem: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: 5,
  },
  patternEmoji: {
    fontSize: 24,
    marginBottom: 5,
  },
  patternType: {
    fontSize: 12,
    color: '#666',
    fontWeight: '500',
  },
  patternCount: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 3,
  },
  effectivenessRow: {
    flexDirection: 'row',
    gap: 15,
    marginTop: 10,
  },
  effectivenessItem: {
    flex: 1,
    padding: 12,
    backgroundColor: '#fff',
    borderRadius: 8,
    borderLeftWidth: 3,
    borderLeftColor: '#4caf50',
  },
  effectivenessLabel: {
    fontSize: 12,
    color: '#999',
    marginBottom: 5,
  },
  effectivenessValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#4caf50',
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 20,
  },
  button: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  buttonPrimary: {
    backgroundColor: '#667eea',
  },
  buttonSecondary: {
    backgroundColor: '#f0f0f0',
  },
  buttonText: {
    fontWeight: '600',
    color: '#333',
  },
  loadingText: {
    fontSize: 16,
    color: '#999',
    textAlign: 'center',
    marginTop: 30,
  },
  errorText: {
    fontSize: 14,
    color: '#f44336',
    textAlign: 'center',
    marginTop: 20,
    marginHorizontal: 20,
  },
  retryButton: {
    backgroundColor: '#667eea',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 6,
    marginTop: 15,
    alignSelf: 'center',
  },
  retryButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
});
