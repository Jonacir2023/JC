import React, { useState, useEffect } from 'react';
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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { saveWeightEntry, getSettings } from '../utils/storage';
import { getTodayString, formatDate } from '../utils/calculations';

export default function AddWeightScreen({ navigation }) {
  const [weight, setWeight] = useState('');
  const [date, setDate] = useState(getTodayString());
  const [note, setNote] = useState('');
  const [unit, setUnit] = useState('kg');
  const [loading, setLoading] = useState(false);
  const [settingsLoading, setSettingsLoading] = useState(true);

  useEffect(() => {
    loadSettings();
  }, []);

  async function loadSettings() {
    try {
      const settings = await getSettings();
      setUnit(settings.unit || 'kg');
    } catch (e) {
      console.error(e);
    } finally {
      setSettingsLoading(false);
    }
  }

  function validateDate(str) {
    // Accepts YYYY-MM-DD
    const regex = /^\d{4}-\d{2}-\d{2}$/;
    if (!regex.test(str)) return false;
    const d = new Date(str);
    return d instanceof Date && !isNaN(d);
  }

  async function handleSave() {
    const trimmedWeight = weight.trim();

    if (!trimmedWeight) {
      Alert.alert('Missing Weight', 'Please enter your weight.');
      return;
    }

    const parsedWeight = parseFloat(trimmedWeight);
    if (isNaN(parsedWeight) || parsedWeight <= 0) {
      Alert.alert('Invalid Weight', 'Please enter a valid positive number for weight.');
      return;
    }

    if (unit === 'kg' && (parsedWeight < 20 || parsedWeight > 500)) {
      Alert.alert('Weight Out of Range', 'Please enter a weight between 20 and 500 kg.');
      return;
    }

    if (unit === 'lbs' && (parsedWeight < 44 || parsedWeight > 1100)) {
      Alert.alert('Weight Out of Range', 'Please enter a weight between 44 and 1100 lbs.');
      return;
    }

    if (!validateDate(date)) {
      Alert.alert('Invalid Date', 'Please enter a date in YYYY-MM-DD format.');
      return;
    }

    setLoading(true);
    try {
      await saveWeightEntry({
        weight: parsedWeight,
        unit,
        date,
        note: note.trim(),
      });
      Alert.alert('Saved!', 'Your weight entry has been logged.', [
        {
          text: 'OK',
          onPress: () => {
            setWeight('');
            setNote('');
            setDate(getTodayString());
            navigation.navigate('Home');
          },
        },
      ]);
    } catch (e) {
      Alert.alert('Error', 'Failed to save entry. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  if (settingsLoading) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#4A90D9" />
        </View>
      </SafeAreaView>
    );
  }

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
            <Text style={styles.title}>Log Weight</Text>
            <Text style={styles.subtitle}>Track your progress</Text>
          </View>

          {/* Weight Input Card */}
          <View style={styles.card}>
            <Text style={styles.fieldLabel}>Weight</Text>

            {/* Unit Toggle */}
            <View style={styles.unitToggleRow}>
              <TouchableOpacity
                style={[styles.unitBtn, unit === 'kg' && styles.unitBtnActive]}
                onPress={() => setUnit('kg')}
              >
                <Text style={[styles.unitBtnText, unit === 'kg' && styles.unitBtnTextActive]}>
                  kg
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.unitBtn, unit === 'lbs' && styles.unitBtnActive]}
                onPress={() => setUnit('lbs')}
              >
                <Text style={[styles.unitBtnText, unit === 'lbs' && styles.unitBtnTextActive]}>
                  lbs
                </Text>
              </TouchableOpacity>
            </View>

            <View style={styles.weightInputRow}>
              <TextInput
                style={styles.weightInput}
                value={weight}
                onChangeText={setWeight}
                placeholder="0.0"
                placeholderTextColor="#C5C5C5"
                keyboardType="decimal-pad"
                returnKeyType="done"
                maxLength={6}
              />
              <Text style={styles.weightUnit}>{unit}</Text>
            </View>
          </View>

          {/* Date Input Card */}
          <View style={styles.card}>
            <Text style={styles.fieldLabel}>Date</Text>
            <TextInput
              style={styles.textInput}
              value={date}
              onChangeText={setDate}
              placeholder="YYYY-MM-DD"
              placeholderTextColor="#C5C5C5"
              keyboardType="numbers-and-punctuation"
              returnKeyType="done"
              maxLength={10}
            />
            <Text style={styles.fieldHint}>Format: YYYY-MM-DD (e.g. {getTodayString()})</Text>
          </View>

          {/* Note Input Card */}
          <View style={styles.card}>
            <Text style={styles.fieldLabel}>Note (optional)</Text>
            <TextInput
              style={[styles.textInput, styles.noteInput]}
              value={note}
              onChangeText={setNote}
              placeholder="e.g. After morning workout"
              placeholderTextColor="#C5C5C5"
              multiline
              maxLength={200}
              returnKeyType="done"
            />
          </View>

          {/* Save Button */}
          <TouchableOpacity
            style={[styles.saveButton, loading && styles.saveButtonDisabled]}
            onPress={handleSave}
            disabled={loading}
            activeOpacity={0.85}
          >
            {loading ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.saveButtonText}>Save Entry</Text>
            )}
          </TouchableOpacity>

          <Text style={styles.footerNote}>
            Entries are stored locally on your device.
          </Text>
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
  fieldLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#9B9B9B',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 12,
  },
  fieldHint: {
    fontSize: 12,
    color: '#BBBBBB',
    marginTop: 6,
  },
  unitToggleRow: {
    flexDirection: 'row',
    backgroundColor: '#F0F4FF',
    borderRadius: 12,
    padding: 4,
    marginBottom: 16,
    alignSelf: 'flex-start',
  },
  unitBtn: {
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 10,
  },
  unitBtnActive: {
    backgroundColor: '#4A90D9',
    elevation: 2,
    shadowColor: '#4A90D9',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  unitBtnText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#9B9B9B',
  },
  unitBtnTextActive: {
    color: '#FFFFFF',
  },
  weightInputRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
  },
  weightInput: {
    fontSize: 52,
    fontWeight: '800',
    color: '#1A1A2E',
    flex: 1,
    paddingVertical: 0,
    borderBottomWidth: 2,
    borderBottomColor: '#4A90D9',
  },
  weightUnit: {
    fontSize: 22,
    fontWeight: '500',
    color: '#9B9B9B',
    marginBottom: 6,
    marginLeft: 8,
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
  noteInput: {
    minHeight: 80,
    textAlignVertical: 'top',
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
    marginTop: 4,
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
  footerNote: {
    fontSize: 12,
    color: '#BBBBBB',
    textAlign: 'center',
  },
});
