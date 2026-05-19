import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Switch,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';

import { getSettings, saveSettings, clearAllData } from '../utils/storage';
import { ftInToCm, cmToFtIn } from '../utils/calculations';

export default function SettingsScreen({ navigation }) {
  const [name, setName] = useState('');
  const [unit, setUnit] = useState('kg');
  const [heightMode, setHeightMode] = useState('cm'); // 'cm' | 'ftin'
  const [heightCm, setHeightCm] = useState('');
  const [heightFt, setHeightFt] = useState('');
  const [heightIn, setHeightIn] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useFocusEffect(
    useCallback(() => {
      loadSettings();
    }, [])
  );

  async function loadSettings() {
    setLoading(true);
    try {
      const settings = await getSettings();
      setName(settings.name || '');
      setUnit(settings.unit || 'kg');

      if (settings.height) {
        setHeightCm(String(settings.height));
        const { feet, inches } = cmToFtIn(settings.height);
        setHeightFt(String(feet));
        setHeightIn(String(inches));
      }
      if (settings.heightFt && settings.heightIn !== undefined) {
        setHeightFt(String(settings.heightFt));
        setHeightIn(String(settings.heightIn));
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  function getHeightCmValue() {
    if (heightMode === 'cm') {
      return parseFloat(heightCm) || null;
    } else {
      const ft = parseFloat(heightFt) || 0;
      const inches = parseFloat(heightIn) || 0;
      if (ft === 0 && inches === 0) return null;
      return ftInToCm(ft, inches);
    }
  }

  async function handleSave() {
    const computedHeightCm = getHeightCmValue();

    if (computedHeightCm !== null) {
      if (computedHeightCm < 50 || computedHeightCm > 300) {
        Alert.alert('Invalid Height', 'Please enter a height between 50 cm and 300 cm.');
        return;
      }
    }

    setSaving(true);
    try {
      await saveSettings({
        name: name.trim(),
        unit,
        height: computedHeightCm ? Math.round(computedHeightCm * 10) / 10 : null,
        heightFt: heightMode === 'ftin' ? (parseFloat(heightFt) || null) : null,
        heightIn: heightMode === 'ftin' ? (parseFloat(heightIn) || null) : null,
        setupComplete: true,
      });
      Alert.alert('Saved', 'Your settings have been updated.');
    } catch (e) {
      Alert.alert('Error', 'Failed to save settings.');
    } finally {
      setSaving(false);
    }
  }

  function handleClearData() {
    Alert.alert(
      'Clear All Data',
      'This will permanently delete all your weight entries and settings. This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear Everything',
          style: 'destructive',
          onPress: async () => {
            try {
              await clearAllData();
              setName('');
              setUnit('kg');
              setHeightCm('');
              setHeightFt('');
              setHeightIn('');
              Alert.alert('Done', 'All data has been cleared.');
            } catch (e) {
              Alert.alert('Error', 'Failed to clear data.');
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

  // Display computed cm height for info purposes in ft/in mode
  const computedCm = getHeightCmValue();

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>Settings</Text>
            <Text style={styles.subtitle}>Personalise your experience</Text>
          </View>

          {/* Profile Card */}
          <View style={styles.card}>
            <Text style={styles.sectionLabel}>Profile</Text>
            <Text style={styles.fieldLabel}>Your Name (optional)</Text>
            <TextInput
              style={styles.textInput}
              value={name}
              onChangeText={setName}
              placeholder="Enter your name"
              placeholderTextColor="#C5C5C5"
              returnKeyType="done"
              maxLength={50}
            />
          </View>

          {/* Units Card */}
          <View style={styles.card}>
            <Text style={styles.sectionLabel}>Weight Unit</Text>
            <View style={styles.unitToggleRow}>
              <TouchableOpacity
                style={[styles.unitBtn, unit === 'kg' && styles.unitBtnActive]}
                onPress={() => setUnit('kg')}
              >
                <Text style={[styles.unitBtnText, unit === 'kg' && styles.unitBtnTextActive]}>
                  Kilograms (kg)
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.unitBtn, unit === 'lbs' && styles.unitBtnActive]}
                onPress={() => setUnit('lbs')}
              >
                <Text style={[styles.unitBtnText, unit === 'lbs' && styles.unitBtnTextActive]}>
                  Pounds (lbs)
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Height Card */}
          <View style={styles.card}>
            <Text style={styles.sectionLabel}>Height</Text>
            <Text style={styles.fieldHint}>
              Required for BMI calculation
            </Text>

            {/* Height Mode Toggle */}
            <View style={styles.heightModeRow}>
              <TouchableOpacity
                style={[styles.modeBtn, heightMode === 'cm' && styles.modeBtnActive]}
                onPress={() => setHeightMode('cm')}
              >
                <Text style={[styles.modeBtnText, heightMode === 'cm' && styles.modeBtnTextActive]}>
                  cm
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modeBtn, heightMode === 'ftin' && styles.modeBtnActive]}
                onPress={() => setHeightMode('ftin')}
              >
                <Text style={[styles.modeBtnText, heightMode === 'ftin' && styles.modeBtnTextActive]}>
                  ft / in
                </Text>
              </TouchableOpacity>
            </View>

            {heightMode === 'cm' ? (
              <View style={styles.heightInputRow}>
                <TextInput
                  style={[styles.textInput, styles.heightInput]}
                  value={heightCm}
                  onChangeText={setHeightCm}
                  placeholder="e.g. 175"
                  placeholderTextColor="#C5C5C5"
                  keyboardType="decimal-pad"
                  returnKeyType="done"
                  maxLength={5}
                />
                <Text style={styles.heightUnitLabel}>cm</Text>
              </View>
            ) : (
              <View style={styles.ftInRow}>
                <View style={styles.ftInField}>
                  <TextInput
                    style={[styles.textInput, styles.ftInInput]}
                    value={heightFt}
                    onChangeText={setHeightFt}
                    placeholder="5"
                    placeholderTextColor="#C5C5C5"
                    keyboardType="number-pad"
                    returnKeyType="next"
                    maxLength={1}
                  />
                  <Text style={styles.heightUnitLabel}>ft</Text>
                </View>
                <View style={styles.ftInField}>
                  <TextInput
                    style={[styles.textInput, styles.ftInInput]}
                    value={heightIn}
                    onChangeText={setHeightIn}
                    placeholder="9"
                    placeholderTextColor="#C5C5C5"
                    keyboardType="number-pad"
                    returnKeyType="done"
                    maxLength={2}
                  />
                  <Text style={styles.heightUnitLabel}>in</Text>
                </View>
              </View>
            )}

            {computedCm && heightMode === 'ftin' && (
              <Text style={styles.fieldHint}>
                ≈ {Math.round(computedCm)} cm
              </Text>
            )}
            {computedCm && heightMode === 'cm' && heightCm && (
              (() => {
                const { feet, inches } = cmToFtIn(computedCm);
                return (
                  <Text style={styles.fieldHint}>
                    ≈ {feet}′{inches}″
                  </Text>
                );
              })()
            )}
          </View>

          {/* Save Button */}
          <TouchableOpacity
            style={[styles.saveButton, saving && styles.saveButtonDisabled]}
            onPress={handleSave}
            disabled={saving}
            activeOpacity={0.85}
          >
            {saving ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.saveButtonText}>Save Settings</Text>
            )}
          </TouchableOpacity>

          {/* Danger Zone */}
          <View style={styles.dangerCard}>
            <Text style={styles.dangerLabel}>Danger Zone</Text>
            <TouchableOpacity
              style={styles.clearButton}
              onPress={handleClearData}
              activeOpacity={0.85}
            >
              <Text style={styles.clearButtonText}>Clear All Data</Text>
            </TouchableOpacity>
            <Text style={styles.dangerHint}>
              Permanently deletes all weight entries and settings.
            </Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
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
  sectionLabel: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1A1A2E',
    marginBottom: 12,
  },
  fieldLabel: {
    fontSize: 13,
    fontWeight: '500',
    color: '#9B9B9B',
    marginBottom: 8,
  },
  fieldHint: {
    fontSize: 12,
    color: '#BBBBBB',
    marginTop: 6,
  },
  textInput: {
    fontSize: 16,
    color: '#1A1A2E',
    borderWidth: 1,
    borderColor: '#E8E8E8',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    backgroundColor: '#FAFAFA',
  },
  unitToggleRow: {
    gap: 8,
  },
  unitBtn: {
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#E8E8E8',
    backgroundColor: '#FAFAFA',
    marginBottom: 4,
  },
  unitBtnActive: {
    borderColor: '#4A90D9',
    backgroundColor: '#EEF4FF',
  },
  unitBtnText: {
    fontSize: 15,
    fontWeight: '500',
    color: '#9B9B9B',
  },
  unitBtnTextActive: {
    color: '#4A90D9',
    fontWeight: '700',
  },
  heightModeRow: {
    flexDirection: 'row',
    backgroundColor: '#F0F4FF',
    borderRadius: 12,
    padding: 4,
    marginBottom: 14,
    alignSelf: 'flex-start',
  },
  modeBtn: {
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 10,
  },
  modeBtnActive: {
    backgroundColor: '#4A90D9',
    elevation: 1,
    shadowColor: '#4A90D9',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
  },
  modeBtnText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#9B9B9B',
  },
  modeBtnTextActive: {
    color: '#FFFFFF',
  },
  heightInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  heightInput: {
    flex: 1,
  },
  heightUnitLabel: {
    fontSize: 15,
    color: '#9B9B9B',
    fontWeight: '500',
    minWidth: 28,
  },
  ftInRow: {
    flexDirection: 'row',
    gap: 12,
  },
  ftInField: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  ftInInput: {
    flex: 1,
  },
  saveButton: {
    backgroundColor: '#4A90D9',
    borderRadius: 16,
    paddingVertical: 18,
    alignItems: 'center',
    elevation: 3,
    shadowColor: '#4A90D9',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    marginBottom: 16,
  },
  saveButtonDisabled: {
    opacity: 0.7,
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '700',
  },
  dangerCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: '#FFCDD2',
  },
  dangerLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: '#EF5350',
    marginBottom: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  clearButton: {
    backgroundColor: '#FFEBEE',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#EF5350',
    marginBottom: 8,
  },
  clearButtonText: {
    color: '#EF5350',
    fontSize: 15,
    fontWeight: '700',
  },
  dangerHint: {
    fontSize: 12,
    color: '#EF9A9A',
    textAlign: 'center',
  },
});
