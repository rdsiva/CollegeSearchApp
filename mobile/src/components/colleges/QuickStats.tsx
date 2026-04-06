import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Colors } from '@/constants/colors';
import type { CollegeDetail } from '@/types';

interface QuickStatsProps {
  college: CollegeDetail;
}

interface StatTileProps {
  label: string;
  value: string;
}

function StatTile({ label, value }: StatTileProps) {
  return (
    <View style={styles.tile}>
      <Text style={styles.tileLabel}>{label}</Text>
      <Text style={styles.tileValue}>{value}</Text>
    </View>
  );
}

export function QuickStats({ college }: QuickStatsProps) {
  const avgLpa = college.placement?.avg_lpa != null
    ? college.placement.avg_lpa.toFixed(1) + ' LPA'
    : 'N/A';

  const tneaFees = college.fees?.tnea != null
    ? '₹' + college.fees.tnea.toLocaleString('en-IN')
    : 'N/A';

  const sentiment = college.reviews?.sentiment_score != null
    ? college.reviews.sentiment_score.toFixed(1) + '/10'
    : 'N/A';

  const placementPct = college.placement?.placement_percentage != null
    ? college.placement.placement_percentage + '%'
    : 'N/A';

  return (
    <View style={styles.row}>
      <StatTile label="Avg LPA" value={avgLpa} />
      <StatTile label="TNEA Fees" value={tneaFees} />
      <StatTile label="Sentiment" value={sentiment} />
      <StatTile label="Placement %" value={placementPct} />
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    gap: 8,
  },
  tile: {
    flex: 1,
    backgroundColor: Colors.primaryLight,
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 6,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.primary,
  },
  tileLabel: {
    fontSize: 10,
    color: Colors.gray500,
    marginBottom: 4,
    textAlign: 'center',
  },
  tileValue: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.primary,
    textAlign: 'center',
  },
});
