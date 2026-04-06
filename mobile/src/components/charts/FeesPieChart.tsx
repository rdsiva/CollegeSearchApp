import React from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import { PieChart } from 'react-native-chart-kit';
import { Colors } from '@/constants/colors';
import type { Fees } from '@/types';

interface FeesPieChartProps {
  fees: Fees;
}

const chartConfig = {
  backgroundColor: Colors.white,
  backgroundGradientFrom: Colors.white,
  backgroundGradientTo: Colors.white,
  color: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
};

export function FeesPieChart({ fees }: FeesPieChartProps) {
  type PieEntry = {
    name: string;
    population: number;
    color: string;
    legendFontColor: string;
    legendFontSize: number;
  };

  const data: PieEntry[] = [];

  if (fees.tnea != null && fees.tnea > 0) {
    data.push({
      name: 'TNEA',
      population: fees.tnea,
      color: Colors.primary,
      legendFontColor: Colors.gray700,
      legendFontSize: 12,
    });
  }
  if (fees.management != null && fees.management > 0) {
    data.push({
      name: 'Management',
      population: fees.management,
      color: Colors.success,
      legendFontColor: Colors.gray700,
      legendFontSize: 12,
    });
  }
  if (fees.hostel != null && fees.hostel > 0) {
    data.push({
      name: 'Hostel',
      population: fees.hostel,
      color: Colors.warning,
      legendFontColor: Colors.gray700,
      legendFontSize: 12,
    });
  }

  if (data.length === 0) return null;

  const chartWidth = Dimensions.get('window').width - 48;

  return (
    <View style={styles.container}>
      <PieChart
        data={data}
        width={chartWidth}
        height={180}
        chartConfig={chartConfig}
        accessor="population"
        backgroundColor="transparent"
        paddingLeft="12"
        absolute={false}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
  },
});
