import AsyncStorage from '@react-native-async-storage/async-storage';

const WEIGHT_ENTRIES_KEY = '@weight_entries';
const SETTINGS_KEY = '@user_settings';

// Default settings
const DEFAULT_SETTINGS = {
  unit: 'kg', // 'kg' or 'lbs'
  height: null, // in cm
  heightFt: null,
  heightIn: null,
  name: '',
  setupComplete: false,
};

// ─── Weight Entries ───────────────────────────────────────────────────────────

/**
 * Retrieve all weight entries, sorted by date ascending.
 * @returns {Promise<Array>} Array of { id, weight, unit, date, note }
 */
export async function getWeightEntries() {
  try {
    const raw = await AsyncStorage.getItem(WEIGHT_ENTRIES_KEY);
    if (!raw) return [];
    const entries = JSON.parse(raw);
    // Sort ascending by date
    return entries.sort((a, b) => new Date(a.date) - new Date(b.date));
  } catch (error) {
    console.error('getWeightEntries error:', error);
    return [];
  }
}

/**
 * Save a new weight entry.
 * @param {Object} entry - { weight, unit, date, note }
 * @returns {Promise<Array>} Updated entries array
 */
export async function saveWeightEntry(entry) {
  try {
    const entries = await getWeightEntries();
    const newEntry = {
      ...entry,
      id: Date.now().toString(),
      createdAt: new Date().toISOString(),
    };
    const updated = [...entries, newEntry];
    await AsyncStorage.setItem(WEIGHT_ENTRIES_KEY, JSON.stringify(updated));
    return updated;
  } catch (error) {
    console.error('saveWeightEntry error:', error);
    throw error;
  }
}

/**
 * Delete a weight entry by id.
 * @param {string} id
 * @returns {Promise<Array>} Updated entries array
 */
export async function deleteWeightEntry(id) {
  try {
    const entries = await getWeightEntries();
    const updated = entries.filter((e) => e.id !== id);
    await AsyncStorage.setItem(WEIGHT_ENTRIES_KEY, JSON.stringify(updated));
    return updated;
  } catch (error) {
    console.error('deleteWeightEntry error:', error);
    throw error;
  }
}

/**
 * Update an existing weight entry.
 * @param {string} id
 * @param {Object} updates - Partial entry fields to update
 * @returns {Promise<Array>} Updated entries array
 */
export async function updateWeightEntry(id, updates) {
  try {
    const entries = await getWeightEntries();
    const updated = entries.map((e) =>
      e.id === id ? { ...e, ...updates, updatedAt: new Date().toISOString() } : e
    );
    await AsyncStorage.setItem(WEIGHT_ENTRIES_KEY, JSON.stringify(updated));
    return updated;
  } catch (error) {
    console.error('updateWeightEntry error:', error);
    throw error;
  }
}

// ─── Settings ─────────────────────────────────────────────────────────────────

/**
 * Retrieve user settings.
 * @returns {Promise<Object>} Settings object
 */
export async function getSettings() {
  try {
    const raw = await AsyncStorage.getItem(SETTINGS_KEY);
    if (!raw) return { ...DEFAULT_SETTINGS };
    return { ...DEFAULT_SETTINGS, ...JSON.parse(raw) };
  } catch (error) {
    console.error('getSettings error:', error);
    return { ...DEFAULT_SETTINGS };
  }
}

/**
 * Save user settings (merges with existing).
 * @param {Object} updates - Partial settings to merge
 * @returns {Promise<Object>} Updated settings object
 */
export async function saveSettings(updates) {
  try {
    const current = await getSettings();
    const updated = { ...current, ...updates };
    await AsyncStorage.setItem(SETTINGS_KEY, JSON.stringify(updated));
    return updated;
  } catch (error) {
    console.error('saveSettings error:', error);
    throw error;
  }
}

/**
 * Clear all app data (for testing / reset).
 */
export async function clearAllData() {
  try {
    await AsyncStorage.multiRemove([WEIGHT_ENTRIES_KEY, SETTINGS_KEY]);
  } catch (error) {
    console.error('clearAllData error:', error);
    throw error;
  }
}
