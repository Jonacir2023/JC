import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  FlatList,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';

import { getWeightEntries, getSettings, deleteWeightEntry } from '../utils/storage';
import {
  convertWeight,
  formatWeight,
  formatDate,
  getWeightDiff,
  getWeightStats,
} from '../utils/calculations';
import WeightChart from '../components/WeightChart';

export default function HistoryScreen({ navigation }) {
  const [entries, setEntries] = useState([]);
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('chart'); // 'chart' | 'list'

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [])
  );

  async function loadData() {
    setLoading(true);
    try {
      const [fetchedEntries, fetchedSettings] = await Promise.all([
        getWeightEntries(),
        getSettings(),
      ]);
      setEntries(fetchedEntries);
      setSettings(fetchedSettings);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  function handleDelete(entry) {
    Alert.alert(
      'Delete Entry',
      `Delete weight entry of ${formatWeight(
        convertWeight(entry.weight, entry.unit || 'kg', unit),
        unit
      )} on ${formatDate(entry.date)}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              const updated = await deleteWeightEntry(entry.id);
              setEntries(updated);
            } catch (e) {
              Alert.alert('Error', 'Failed to delete entry.');
            }
          },
        },
      ]
    );
  }

  if (loading) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#4A90D9" />
        </View>
      </SafeAreaView>
    );
  }

  const unit = settings?.unit || 'kg';
  const stats = getWeightStats(entries, unit);

  // Reverse entries for list display (newest first)
  const reversedEntries = [...entries].reverse();

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>History</Text>
          <Text style={styles.subtitle}>{entries.length} entries logged</Text>
        </View>

        {/* Stats Row */}
        {stats && (
          <View style={styles.statsRow}>
            <View style={styles.statBox}>
              <Text style={styles.statLabel}>Start</Text>
              <Text style={styles.statValue}>{stats.startWeight}</Text>
              <Text style={styles.statUnit}>{unit}</Text>
            </View>
            <View style={styles.statBox}>
              <Text style={styles.statLabel}>Current</Text>
              <Text style={styles.statValue}>{stats.currentWeight}</Text>
              <Text style={styles.statUnit}>{unit}</Text>
            </View>
            <View style={styles.statBox}>
              <Text style={styles.statLabel}>Change</Text>
              <Text
                style={[
                  styles.statValue,
                  { color: stats.totalChangeRaw <= 0 ? '#66BB6A' : '#EF5350' },
                ]}
              >
                {stats.totalChangeRaw <= 0 ? '-' : '+'}{stats.totalChange}
              </Text>
              <Text style={styles.statUnit}>{unit}</Text>
            </View>
            <View style={styles.statBox}>
              <Text style={styles.statLabel}>Avg</Text>
              <Text style={styles.statValue}>{stats.average}</Text>
              <Text style={styles.statUnit}>{unit}</Text>
            </View>
          </View>
        )}

        {/* Tab Toggle */}
        <View style={styles.tabRow}>
          <TouchableOpacity
            style={[styles.tabBtn, activeTab === 'chart' && styles.tabBtnActive]}
            onPress={() => setActiveTab('chart')}
          >
            <Text style={[styles.tabBtnText, activeTab === 'chart' && styles.tabBtnTextActive]}>
              📈  Chart
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tabBtn, activeTab === 'list' && styles.tabBtnActive]}
            onPress={() => setActiveTab('list')}
          >
            <Text style={[styles.tabBtnText, activeTab === 'list' && styles.tabBtnTextActive]}>
              📋  List
            </Text>
          </TouchableOpacity>
        </View>

        {/* Chart Tab */}
        {activeTab === 'chart' && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Weight Trend</Text>
            {entries.length < 2 ? (
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyIcon}>📈</Text>
                <Text style={styles.emptyText}>
                  Log at least 2 weight entries to see your trend chart.
                </Text>
              </View>
            ) : (
              <WeightChart entries={entries} unit={unit} height={220} />
            )}
          </View>
        )}

        {/* List Tab */}
        {activeTab === 'list' && (
          <View>
            {reversedEntries.length === 0 ? (
              <View style={styles.card}>
                <View style={styles.emptyContainer}>
                  <Text style={styles.emptyIcon}>📋</Text>
                  <Text style={styles.emptyText}>
                    No entries yet. Start logging your weight!
                  </Text>
                </View>
              </View>
            ) : (
              reversedEntries.map((entry, index) => {
                // Compute diff relative to previous entry (in original ascending order)
                const originalIndex = entries.findIndex((e) => e.id === entry.id);
                const prevEntry = originalIndex > 0 ? entries[originalIndex - 1] : null;

                let diffDisplay = null;
                if (prevEntry) {
                  const currKg = convertWeight(entry.weight, entry.unit || 'kg', 'kg');
                  const prevKg = convertWeight(prevEntry.weight, prevEntry.unit || 'kg', 'kg');
                  const diffKg = currKg - prevKg;
                  const diffInUnit = convertWeight(Math.abs(diffKg), 'kg', unit);
                  diffDisplay = {
                    value: parseFloat(diffInUnit.toFixed(1)),
                    direction: diffKg < 0 ? 'down' : diffKg > 0 ? 'up' : 'same',
                  };
                }

                const displayWeight = parseFloat(
                  convertWeight(entry.weight, entry.unit || 'kg', unit).toFixed(1)
                );

                return (
                  <View key={entry.id} style={styles.entryCard}>
                    <View style={styles.entryLeft}>
                      <Text style={styles.entryDate}>{formatDate(entry.date)}</Text>
                      {entry.note ? (
                        <Text style={styles.entryNote} numberOfLines={1}>
                          {entry.note}
                        </Text>
                      ) : null}
                    </View>

                    <View style={styles.entryRight}>
                      <Text style={styles.entryWeight}>
                        {displayWeight}
                        <Text style={styles.entryUnit}> {unit}</Text>
                      </Text>
                      {diffDisplay && (
                        <Text
                          style={[
                            styles.entryDiff,
                            diffDisplay.direction === 'down'
                              ? styles.diffDown
                              : diffDisplay.direction === 'up'
                              ? styles.diffUp
                              : styles.diffSame,
                          ]}
                        >
                          {diffDisplay.direction === 'down'
                            ? `▼ -${diffDisplay.value}`
                            : diffDisplay.direction === 'up'
                            ? `▲ +${diffDisplay.value}`
                            : '— 0'}
                          {' '}{unit}
                        </Text>
                      )}
                    </View>

                    <TouchableOpacity
                      style={styles.deleteBtn}
                      onPress={() => handleDelete(entry)}
                      hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                    >
                      <Text style={styles.deleteBtnText}>✕</Text>
                    </TouchableOpacity>
                  </View>
                );
              })
            )}
          </View>
        )}

        {/* Add Entry CTA */}
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => navigation.navigate('Add Weight')}
          activeOpacity={0.85}
        >
          <Text style={styles.addButtonText}>➕  Log New Entry</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#F0F4FF',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scroll: {
    paddingHorizontal: 16,
    paddingBottom: 40,
  },
  header: {
    paddingTop: 20,
    paddingBottom: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: '#1A1A2E',
  },
  subtitle: {
    fontSize: 14,
    color: '#9B9B9B',
    marginTop: 2,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  statBox: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 12,
    alignItems: 'center',
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
  },
  statLabel: {
    fontSize: 10,
    color: '#9B9B9B',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 4,
    textAlign: 'center',
  },
  statValue: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1A1A2E',
    textAlign: 'center',
  },
  statUnit: {
    fontSize: 10,
    color: '#9B9B9B',
    textAlign: 'center',
    marginTop: 1,
  },
  tabRow: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 4,
    marginBottom: 16,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
  },
  tabBtn: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 10,
  },
  tabBtnActive: {
    backgroundColor: '#4A90D9',
    elevation: 2,
    shadowColor: '#4A90D9',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  tabBtnText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#9B9B9B',
  },
  tabBtnTextActive: {
    color: '#FFFFFF',
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 16,
    marginBottom: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
  },
  cardTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#9B9B9B',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 12,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 32,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 12,
  },
  emptyText: {
    fontSize: 14,
    color: '#9B9B9B',
    textAlign: 'center',
    lineHeight: 22,
  },
  entryCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 14,
    marginBottom: 8,
    flexDirection: 'row',
    alignItems: 'center',
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
  },
  entryLeft: {
    flex: 1,
  },
  entryDate: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1A1A2E',
  },
  entryNote: {
    fontSize: 12,
    color: '#9B9B9B',
    marginTop: 2,
  },
  entryRight: {
    alignItems: 'flex-end',
    marginRight: 12,
  },
  entryWeight: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1A1A2E',
  },
  entryUnit: {
    fontSize: 13,
    fontWeight: '400',
    color: '#9B9B9B',
  },
  entryDiff: {
    fontSize: 12,
    fontWeight: '600',
    marginTop: 2,
  },
  diffDown: {
    color: '#66BB6A',
  },
  diffUp: {
    color: '#EF5350',
  },
  diffSame: {
    color: '#9B9B9B',
  },
  deleteBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#FFEBEE',
    alignItems: 'center',
    justifyContent: 'center',
  },
  deleteBtnText: {
    fontSize: 12,
    color: '#EF5350',
    fontWeight: '700',
  },
  addButton: {
    backgroundColor: '#4A90D9',
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: 'center',
    elevation: 3,
    shadowColor: '#4A90D9',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    marginTop: 8,
  },
  addButtonText: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '700',
  },
});
