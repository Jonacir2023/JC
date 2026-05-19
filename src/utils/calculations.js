// ─── Unit Conversions ─────────────────────────────────────────────────────────

/**
 * Convert pounds to kilograms.
 */
export function lbsToKg(lbs) {
  return lbs * 0.453592;
}

/**
 * Convert kilograms to pounds.
 */
export function kgToLbs(kg) {
  return kg * 2.20462;
}

/**
 * Convert a weight value to a target unit.
 * @param {number} value - The weight value
 * @param {string} fromUnit - 'kg' or 'lbs'
 * @param {string} toUnit - 'kg' or 'lbs'
 */
export function convertWeight(value, fromUnit, toUnit) {
  if (fromUnit === toUnit) return value;
  if (fromUnit === 'lbs' && toUnit === 'kg') return lbsToKg(value);
  if (fromUnit === 'kg' && toUnit === 'lbs') return kgToLbs(value);
  return value;
}

/**
 * Format a weight value to 1 decimal place with unit label.
 */
export function formatWeight(value, unit) {
  return `${parseFloat(value).toFixed(1)} ${unit}`;
}

// ─── BMI Calculations ─────────────────────────────────────────────────────────

/**
 * Calculate BMI given weight in kg and height in cm.
 * @returns {number} BMI rounded to 1 decimal place
 */
export function calculateBMI(weightKg, heightCm) {
  if (!weightKg || !heightCm || heightCm <= 0) return null;
  const heightM = heightCm / 100;
  const bmi = weightKg / (heightM * heightM);
  return Math.round(bmi * 10) / 10;
}

/**
 * Get BMI category label and color.
 * @param {number} bmi
 * @returns {{ category: string, color: string }}
 */
export function getBMICategory(bmi) {
  if (bmi === null || isNaN(bmi)) {
    return { category: 'Unknown', color: '#9B9B9B' };
  }
  if (bmi < 18.5) {
    return { category: 'Underweight', color: '#4FC3F7' };
  }
  if (bmi < 25) {
    return { category: 'Normal weight', color: '#66BB6A' };
  }
  if (bmi < 30) {
    return { category: 'Overweight', color: '#FFA726' };
  }
  return { category: 'Obese', color: '#EF5350' };
}

/**
 * Convert height in feet and inches to centimeters.
 */
export function ftInToCm(feet, inches) {
  return (feet * 12 + inches) * 2.54;
}

/**
 * Convert height in cm to feet and inches.
 * @returns {{ feet: number, inches: number }}
 */
export function cmToFtIn(cm) {
  const totalInches = cm / 2.54;
  const feet = Math.floor(totalInches / 12);
  const inches = Math.round(totalInches % 12);
  return { feet, inches };
}

// ─── Weight Statistics ────────────────────────────────────────────────────────

/**
 * Calculate the difference between the latest and previous weight entry,
 * normalised to the display unit.
 * @param {Array} entries - sorted ascending by date
 * @param {string} displayUnit - 'kg' or 'lbs'
 * @returns {{ diff: number, percent: number } | null}
 */
export function getWeightDiff(entries, displayUnit) {
  if (!entries || entries.length < 2) return null;
  const latest = entries[entries.length - 1];
  const previous = entries[entries.length - 2];

  const latestKg = convertWeight(latest.weight, latest.unit || 'kg', 'kg');
  const previousKg = convertWeight(previous.weight, previous.unit || 'kg', 'kg');

  const diffKg = latestKg - previousKg;
  const diff = convertWeight(Math.abs(diffKg), 'kg', displayUnit);
  const percent = Math.abs((diffKg / previousKg) * 100);

  return {
    diff: parseFloat(diff.toFixed(1)),
    rawDiff: diffKg, // negative = lost weight
    percent: parseFloat(percent.toFixed(1)),
    direction: diffKg < 0 ? 'down' : diffKg > 0 ? 'up' : 'same',
  };
}

/**
 * Calculate overall stats from an array of entries.
 * @param {Array} entries - sorted ascending by date
 * @param {string} displayUnit
 * @returns {Object} { min, max, average, total, startWeight, currentWeight }
 */
export function getWeightStats(entries, displayUnit) {
  if (!entries || entries.length === 0) return null;

  const weightsKg = entries.map((e) =>
    convertWeight(e.weight, e.unit || 'kg', 'kg')
  );

  const minKg = Math.min(...weightsKg);
  const maxKg = Math.max(...weightsKg);
  const avgKg = weightsKg.reduce((a, b) => a + b, 0) / weightsKg.length;

  return {
    min: parseFloat(convertWeight(minKg, 'kg', displayUnit).toFixed(1)),
    max: parseFloat(convertWeight(maxKg, 'kg', displayUnit).toFixed(1)),
    average: parseFloat(convertWeight(avgKg, 'kg', displayUnit).toFixed(1)),
    startWeight: parseFloat(
      convertWeight(weightsKg[0], 'kg', displayUnit).toFixed(1)
    ),
    currentWeight: parseFloat(
      convertWeight(weightsKg[weightsKg.length - 1], 'kg', displayUnit).toFixed(1)
    ),
    totalChange: parseFloat(
      convertWeight(
        Math.abs(weightsKg[weightsKg.length - 1] - weightsKg[0]),
        'kg',
        displayUnit
      ).toFixed(1)
    ),
    totalChangeRaw: weightsKg[weightsKg.length - 1] - weightsKg[0],
  };
}

// ─── Motivational Messages ────────────────────────────────────────────────────

/**
 * Return a motivational message based on recent weight trend.
 */
export function getMotivationalMessage(entries, displayUnit) {
  if (!entries || entries.length === 0) {
    return "Welcome! Log your first weight to get started. 🚀";
  }

  if (entries.length === 1) {
    return "Great start! Keep logging your weight daily for best results. 💪";
  }

  const diff = getWeightDiff(entries, displayUnit);
  if (!diff) return "Keep up the great work! 🌟";

  if (diff.direction === 'same') {
    return "Steady as she goes! Consistency is key. 🎯";
  }

  if (diff.direction === 'down') {
    return `Amazing! You're down ${diff.diff} ${displayUnit} from last entry. Keep it up! 🎉`;
  }

  if (diff.direction === 'up' && diff.diff <= 1) {
    return "Small fluctuations are normal. Stay the course! 💪";
  }

  return "Every journey has ups and downs. You've got this! 🌟";
}

/**
 * Format a date string for display.
 * @param {string} dateString - ISO date string or YYYY-MM-DD
 * @returns {string} Formatted date like "May 19, 2026"
 */
export function formatDate(dateString) {
  if (!dateString) return '';
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

/**
 * Get today's date as YYYY-MM-DD string.
 */
export function getTodayString() {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const day = String(today.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}
