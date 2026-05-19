import React from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import { LineChart } from 'react-native-chart-kit';
import { convertWeight } from '../utils/calculations';

const screenWidth = Dimensions.get('window').width;

/**
 * WeightChart - renders a line chart of weight entries.
 *
 * Props:
 *   entries   {Array}  - sorted ascending weight entries
 *   unit      {string} - display unit ('kg' or 'lbs')
 *   height    {number} - chart height (default 220)
 */
export default function WeightChart({ entries = [], unit = 'kg', height = 220 }) {
  if (!entries || entries.length < 2) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyIcon}>📈</Text>
        <Text style={styles.emptyText}>
          Log at least 2 entries to see your weight trend chart.
        </Text>
      </View>
    );
  }

  // Take last 30 entries for readability
  const displayEntries = entries.slice(-30);

  const weights = displayEntries.map((e) =>
    parseFloat(convertWeight(e.weight, e.unit || 'kg', unit).toFixed(1))
  );

  // Build x-axis labels: show every nth label to avoid crowding
  const labelStep = Math.max(1, Math.floor(displayEntries.length / 6));
  const labels = displayEntries.map((e, i) => {
    if (i % labelStep === 0 || i === displayEntries.length - 1) {
      const d = new Date(e.date);
      return `${d.getMonth() + 1}/${d.getDate()}`;
    }
    return '';
  });

  const minWeight = Math.min(...weights);
  const maxWeight = Math.max(...weights);
  const padding = Math.max(1, (maxWeight - minWeight) * 0.15);

  const chartConfig = {
    backgroundColor: '#FFFFFF',
    backgroundGradientFrom: '#FFFFFF',
    backgroundGradientTo: '#F8F9FF',
    decimalPlaces: 1,
    color: (opacity = 1) => `rgba(74, 144, 217, ${opacity})`,
    labelColor: (opacity = 1) => `rgba(100, 100, 120, ${opacity})`,
    style: {
      borderRadius: 16,
    },
    propsForDots: {
      r: '4',
      strokeWidth: '2',
      stroke: '#4A90D9',
      fill: '#FFFFFF',
    },
    propsForBackgroundLines: {
      strokeDasharray: '4,4',
      stroke: 'rgba(74, 144, 217, 0.15)',
    },
    fillShadowGradient: '#4A90D9',
    fillShadowGradientOpacity: 0.15,
  };

  const chartData = {
    labels,
    datasets: [
      {
        data: weights,
        color: (opacity = 1) => `rgba(74, 144, 217, ${opacity})`,
        strokeWidth: 2.5,
      },
      // invisible min/max data points to keep the y-axis stable
      {
        data: [minWeight - padding, maxWeight + padding],
        color: () => 'transparent',
        strokeWidth: 0,
        withDots: false,
      },
    ],
    legend: [`Weight (${unit})`],
  };

  return (
    <View style={styles.container}>
      <LineChart
        data={chartData}
        width={screenWidth - 32}
        height={height}
        chartConfig={chartConfig}
        bezier
        style={styles.chart}
        withInnerLines
        withOuterLines={false}
        withShadow
        fromZero={false}
        yAxisSuffix={` ${unit}`}
        segments={4}
        getDotColor={(dataPoint, dataPointIndex) => '#4A90D9'}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    marginVertical: 8,
  },
  chart: {
    borderRadius: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
    backgroundColor: '#F8F9FF',
    borderRadius: 16,
    marginHorizontal: 16,
    marginVertical: 8,
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
});
