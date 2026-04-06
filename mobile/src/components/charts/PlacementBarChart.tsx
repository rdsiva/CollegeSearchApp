import React from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import { BarChart } from 'react-native-chart-kit';
import { Colors } from '@/constants/colors';
import type { Placement } from '@/types';

interface PlacementBarChartProps {
  placement: Placement;
}

const chartConfig = {
  backgroundColor: Colors.white,
  backgroundGradientFrom: Colors.white,
  backgroundGradientTo: Colors.white,
  decimalPlaces: 1,
  color: (opacity = 1) => `rgba(37, 99, 235, ${opacity})`,
  labelColor: (opacity = 1) => `rgba(75, 85, 99, ${opacity})`,
  style: {
    borderRadius: 8,
  },
  barPercentage: 0.6,
};

export function PlacementBarChart({ placement }: PlacementBarChartProps) {
  const avg = placement.avg_lpa;
  const highest = placement.highest_lpa;

  if (avg == null && highest == null) return null;

  const labels: string[] = [];
  const values: number[] = [];

  if (avg != null) {
    labels.push('Avg LPA');
    values.push(avg);
  }
  if (highest != null) {
    labels.push('Highest LPA');
    values.push(highest);
  }

  const chartWidth = Dimensions.get('window').width - 48;

  return (
    <View style={styles.container}>
      <BarChart
        data={{ labels, datasets: [{ data: values }] }}
        width={chartWidth}
        height={180}
        chartConfig={chartConfig}
        style={styles.chart}
        yAxisLabel=""
        yAxisSuffix=" L"
        showValuesOnTopOfBars
        fromZero
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
  },
  chart: {
    borderRadius: 8,
  },
});
