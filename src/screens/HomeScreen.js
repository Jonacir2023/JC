import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { getWeightEntries, getSettings } from '../utils/storage';
import {
  calculateBMI,
  getBMICategory,
  getMotivationalMessage,
  getWeightDiff,
  convertWeight,
  formatWeight,
  formatDate,
} from '../utils/calculations';

export default function HomeScreen({ navigation }) {
  const [entries, setEntries] = useState([]);
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);

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
  const hasEntries = entries.length > 0;
  const latestEntry = hasEntries ? entries[entries.length - 1] : null;
  const latestWeightInUnit = latestEntry
    ? parseFloat(convertWeight(latestEntry.weight, latestEntry.unit || 'kg', unit).toFixed(1))
    : null;

  // BMI calculation
  const heightCm = settings?.height || null;
  const bmi =
    latestEntry && heightCm
      ? calculateBMI(
          convertWeight(latestEntry.weight, latestEntry.unit || 'kg', 'kg'),
          heightCm
        )
      : null;
  const bmiInfo = getBMICategory(bmi);

  // Weight difference from previous
  const diff = getWeightDiff(entries, unit);
  const motivationalMessage = getMotivationalMessage(entries, unit);

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.greeting}>
            {settings?.name ? `Hi, ${settings.name}! 👋` : 'Weight Tracker 🏋️'}
          </Text>
          <Text style={styles.subGreeting}>
            {formatDate(new Date().toISOString())}
          </Text>
        </View>

        {/* Motivational Message */}
        <View style={styles.motivationCard}>
          <Text style={styles.motivationText}>{motivationalMessage}</Text>
        </View>

        {/* Current Weight Card */}
        <View style={styles.card}>
          <Text style={styles.cardLabel}>Current Weight</Text>
          {latestWeightInUnit !== null ? (
            <>
              <Text style={styles.weightValue}>
                {latestWeightInUnit}
                <Text style={styles.unitLabel}> {unit}</Text>
              </Text>
              <Text style={styles.lastLoggedDate}>
                Logged on {formatDate(latestEntry.date)}
              </Text>
              {diff && (
                <View style={styles.diffRow}>
                  <View
                    style={[
                      styles.diffBadge,
                      diff.direction === 'down'
                        ? styles.diffBadgeGood
                        : diff.direction === 'up'
                        ? styles.diffBadgeBad
                        : styles.diffBadgeNeutral,
                    ]}
                  >
                    <Text style={styles.diffBadgeText}>
                      {diff.direction === 'down' ? '▼' : diff.direction === 'up' ? '▲' : '—'}{' '}
                      {diff.diff} {unit} from last entry
                    </Text>
                  </View>
                </View>
              )}
            </>
          ) : (
            <Text style={styles.noDataText}>No entries yet</Text>
          )}
        </View>

        {/* BMI Card */}
        <View style={styles.card}>
          <Text style={styles.cardLabel}>BMI</Text>
          {bmi !== null ? (
            <>
              <Text style={[styles.bmiValue, { color: bmiInfo.color }]}>
                {bmi}
              </Text>
              <View style={[styles.bmiCategoryBadge, { backgroundColor: bmiInfo.color + '22' }]}>
                <Text style={[styles.bmiCategoryText, { color: bmiInfo.color }]}>
                  {bmiInfo.category}
                </Text>
              </View>
            </>
          ) : (
            <View>
              <Text style={styles.noDataText}>
                {heightCm ? 'Log your weight to calculate BMI' : 'Set your height in Settings to calculate BMI'}
              </Text>
              {!heightCm && (
                <TouchableOpacity
                  style={styles.settingsButton}
                  onPress={() => navigation.navigate('Settings')}
                >
                  <Text style={styles.settingsButtonText}>Go to Settings</Text>
                </TouchableOpacity>
              )}
            </View>
          )}
        </View>

        {/* Quick Stats Row */}
        {entries.length >= 2 && (
          <View style={styles.statsRow}>
            <View style={styles.statBox}>
              <Text style={styles.statLabel}>Entries</Text>
              <Text style={styles.statValue}>{entries.length}</Text>
            </View>
            <View style={styles.statBox}>
              <Text style={styles.statLabel}>First Logged</Text>
              <Text style={styles.statValue}>
                {formatDate(entries[0].date)}
              </Text>
            </View>
            <View style={styles.statBox}>
              <Text style={styles.statLabel}>Days Tracked</Text>
              <Text style={styles.statValue}>
                {Math.round(
                  (new Date(entries[entries.length - 1].date) - new Date(entries[0].date)) /
                    (1000 * 60 * 60 * 24)
                ) + 1}
              </Text>
            </View>
          </View>
        )}

        {/* CTA Button */}
        <TouchableOpacity
          style={styles.logButton}
          onPress={() => navigation.navigate('Add Weight')}
          activeOpacity={0.85}
        >
          <Text style={styles.logButtonText}>➕  Log Today's Weight</Text>
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
    paddingBottom: 32,
  },
  header: {
    paddingTop: 20,
    paddingBottom: 12,
  },
  greeting: {
    fontSize: 26,
    fontWeight: '700',
    color: '#1A1A2E',
  },
  subGreeting: {
    fontSize: 14,
    color: '#9B9B9B',
    marginTop: 2,
  },
  motivationCard: {
    backgroundColor: '#4A90D9',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    elevation: 2,
    shadowColor: '#4A90D9',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
  },
  motivationText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '500',
    lineHeight: 22,
    textAlign: 'center',
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
    marginBottom: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
  },
  cardLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#9B9B9B',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 8,
  },
  weightValue: {
    fontSize: 56,
    fontWeight: '800',
    color: '#1A1A2E',
    lineHeight: 64,
  },
  unitLabel: {
    fontSize: 24,
    fontWeight: '500',
    color: '#9B9B9B',
  },
  lastLoggedDate: {
    fontSize: 13,
    color: '#9B9B9B',
    marginTop: 4,
  },
  diffRow: {
    marginTop: 12,
  },
  diffBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  diffBadgeGood: {
    backgroundColor: '#E8F5E9',
  },
  diffBadgeBad: {
    backgroundColor: '#FFEBEE',
  },
  diffBadgeNeutral: {
    backgroundColor: '#F5F5F5',
  },
  diffBadgeText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#333',
  },
  bmiValue: {
    fontSize: 48,
    fontWeight: '800',
    lineHeight: 56,
  },
  bmiCategoryBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    marginTop: 8,
  },
  bmiCategoryText: {
    fontSize: 14,
    fontWeight: '600',
  },
  noDataText: {
    fontSize: 14,
    color: '#9B9B9B',
    marginTop: 4,
  },
  settingsButton: {
    marginTop: 12,
    backgroundColor: '#4A90D9',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  settingsButtonText: {
    color: '#FFF',
    fontWeight: '600',
    fontSize: 13,
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
    padding: 14,
    alignItems: 'center',
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
  },
  statLabel: {
    fontSize: 11,
    color: '#9B9B9B',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 4,
    textAlign: 'center',
  },
  statValue: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1A1A2E',
    textAlign: 'center',
  },
  logButton: {
    backgroundColor: '#4A90D9',
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: 'center',
    elevation: 3,
    shadowColor: '#4A90D9',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    marginTop: 4,
  },
  logButtonText: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '700',
  },
});
