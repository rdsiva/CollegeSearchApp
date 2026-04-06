import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Colors } from '@/constants/colors';
import type { ScoreBreakdown } from '@/types';

interface ScoreBarChartProps {
  breakdown: ScoreBreakdown;
}

interface BarRowProps {
  label: string;
  value: number;
  maxValue: number;
}

function getBarColor(value: number): string {
  if (value > 30) return Colors.success;
  if (value >= 15) return Colors.warning;
  return Colors.danger;
}

function BarRow({ label, value, maxValue }: BarRowProps) {
  const pct = maxValue > 0 ? Math.min(value / maxValue, 1) : 0;
  const color = getBarColor(value);

  return (
    <View style={styles.barRow}>
      <Text style={styles.barLabel}>{label}</Text>
      <View style={styles.barTrack}>
        {pct > 0 && (
          <View style={[styles.barFill, { flex: pct, backgroundColor: color }]} />
        )}
        {pct < 1 && <View style={{ flex: Math.max(1 - pct, 0.001) }} />}
      </View>
      <Text style={[styles.barValue, { color }]}>{value}</Text>
    </View>
  );
}

export function ScoreBarChart({ breakdown }: ScoreBarChartProps) {
  return (
    <View style={styles.container}>
      <BarRow label="Placement" value={breakdown.placement} maxValue={40} />
      <BarRow label="Fees Afford." value={breakdown.fees_affordability} maxValue={20} />
      <BarRow label="Reviews" value={breakdown.reviews_sentiment} maxValue={20} />
      <BarRow label="Infrastructure" value={breakdown.infrastructure} maxValue={20} />
      <BarRow label="Location" value={breakdown.location} maxValue={20} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 10,
  },
  barRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  barLabel: {
    width: 110,
    fontSize: 12,
    color: Colors.gray700,
    flexShrink: 0,
  },
  barTrack: {
    flex: 1,
    height: 12,
    backgroundColor: Colors.gray200,
    borderRadius: 6,
    flexDirection: 'row',
    overflow: 'hidden',
  },
  barFill: {
    height: 12,
    borderRadius: 6,
  },
  barValue: {
    width: 28,
    fontSize: 12,
    fontWeight: '700',
    textAlign: 'right',
    flexShrink: 0,
  },
});
