import React from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useCompare } from '@/context/CompareContext';
import { ScoreBadge } from '@/components/ui/ScoreBadge';
import { Colors } from '@/constants/colors';
import type { CollegeDetail } from '@/types';

const LABEL_WIDTH = 130;
const COL_WIDTH = 160;
const ROW_HEIGHT = 52;

interface RowDef {
  label: string;
  key: string;
  format: (college: CollegeDetail) => string | null;
  higherIsBetter?: boolean;
  lowerIsBetter?: boolean;
}

function getMinOcCutoff2026(college: CollegeDetail): number | null {
  let min: number | null = null;
  for (const course of college.courses) {
    const val = course.cutoffs_2026_predicted?.OC ?? null;
    if (val != null) {
      if (min === null || val < min) min = val;
    }
  }
  return min;
}

const ROWS: RowDef[] = [
  {
    label: 'Overall Score\n(/100)',
    key: 'score',
    format: (c) => (c.score != null ? c.score.toFixed(1) : 'N/A'),
    higherIsBetter: true,
  },
  {
    label: 'Affiliation',
    key: 'affiliation',
    format: (c) => c.affiliation ?? 'N/A',
  },
  {
    label: 'NIRF Rank',
    key: 'nirf_rank',
    format: (c) => (c.nirf_rank != null ? `#${c.nirf_rank}` : 'N/A'),
    lowerIsBetter: true,
  },
  {
    label: 'Google Rating',
    key: 'google_rating',
    format: (c) =>
      c.reviews?.google_rating != null
        ? `${c.reviews.google_rating.toFixed(1)}/5`
        : 'N/A',
    higherIsBetter: true,
  },
  {
    label: 'TNEA Fees',
    key: 'tnea_fees',
    format: (c) => {
      const fee = c.fees?.tnea ?? null;
      if (fee == null) return 'N/A';
      return `₹${fee.toLocaleString('en-IN')}/yr`;
    },
    lowerIsBetter: true,
  },
  {
    label: 'Avg Package',
    key: 'avg_lpa',
    format: (c) =>
      c.placement?.avg_lpa != null
        ? `${c.placement.avg_lpa.toFixed(1)} LPA`
        : 'N/A',
    higherIsBetter: true,
  },
  {
    label: 'Highest Package',
    key: 'highest_lpa',
    format: (c) =>
      c.placement?.highest_lpa != null
        ? `${c.placement.highest_lpa.toFixed(1)} LPA`
        : 'N/A',
    higherIsBetter: true,
  },
  {
    label: 'Placement %',
    key: 'placement_pct',
    format: (c) =>
      c.placement?.placement_percentage != null
        ? `${c.placement.placement_percentage}%`
        : 'N/A',
    higherIsBetter: true,
  },
  {
    label: '2026 OC Cutoff\n(best branch)',
    key: 'oc_cutoff_2026',
    format: (c) => {
      const val = getMinOcCutoff2026(c);
      return val != null ? val.toString() : 'N/A';
    },
    lowerIsBetter: true,
  },
];

function getNumericValues(colleges: CollegeDetail[], row: RowDef): (number | null)[] {
  return colleges.map((c) => {
    const raw = row.format(c);
    if (!raw || raw === 'N/A') return null;
    const num = parseFloat(raw.replace(/[^0-9.]/g, ''));
    return isNaN(num) ? null : num;
  });
}

function getBestIndex(values: (number | null)[], row: RowDef): number | null {
  if (!row.higherIsBetter && !row.lowerIsBetter) return null;
  let bestIdx: number | null = null;
  let bestVal: number | null = null;
  values.forEach((v, i) => {
    if (v == null) return;
    if (bestVal === null) {
      bestVal = v;
      bestIdx = i;
    } else if (row.higherIsBetter && v > bestVal) {
      bestVal = v;
      bestIdx = i;
    } else if (row.lowerIsBetter && v < bestVal) {
      bestVal = v;
      bestIdx = i;
    }
  });
  return bestIdx;
}

export default function CompareTable() {
  const { compareList, removeFromCompare } = useCompare();

  return (
    <View style={styles.tableWrapper}>
      {/* Label column */}
      <View style={styles.labelColumn}>
        <View style={[styles.headerCell, styles.labelHeaderCell]} />
        {ROWS.map((row, rowIdx) => (
          <View
            key={row.key}
            style={[
              styles.labelCell,
              rowIdx % 2 === 0
                ? { backgroundColor: Colors.white }
                : { backgroundColor: Colors.gray50 },
            ]}
          >
            <Text style={styles.labelText}>{row.label}</Text>
          </View>
        ))}
      </View>

      {/* Scrollable data columns */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.scrollArea}>
        {compareList.map((college, colIdx) => {
          return (
            <View key={college.code} style={styles.dataColumn}>
              {/* Header */}
              <View style={styles.headerCell}>
                <View style={styles.headerContent}>
                  <Text style={styles.headerName} numberOfLines={2}>
                    {college.name}
                  </Text>
                  <View style={styles.codeBadge}>
                    <Text style={styles.codeBadgeText}>{college.anna_university_code}</Text>
                  </View>
                </View>
                <TouchableOpacity
                  onPress={() => removeFromCompare(college.code)}
                  style={styles.removeButton}
                  accessibilityLabel="Remove from compare"
                >
                  <Feather name="x" size={14} color={Colors.gray500} />
                </TouchableOpacity>
              </View>

              {/* Data rows */}
              {ROWS.map((row, rowIdx) => {
                const values = getNumericValues(compareList, row);
                const bestIdx = getBestIndex(values, row);
                const isBest = bestIdx === colIdx;
                const cellValue = row.format(college);
                const isScore = row.key === 'score';

                return (
                  <View
                    key={row.key}
                    style={[
                      styles.dataCell,
                      rowIdx % 2 === 0
                        ? { backgroundColor: Colors.white }
                        : { backgroundColor: Colors.gray50 },
                      isBest && styles.bestCell,
                    ]}
                  >
                    {isScore ? (
                      <ScoreBadge score={college.score} size="sm" />
                    ) : (
                      <Text
                        style={[
                          styles.cellText,
                          isBest && styles.bestCellText,
                          cellValue === 'N/A' && styles.naText,
                        ]}
                        numberOfLines={2}
                      >
                        {cellValue}
                      </Text>
                    )}
                  </View>
                );
              })}
            </View>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  tableWrapper: {
    flex: 1,
    flexDirection: 'row',
  },
  labelColumn: {
    width: LABEL_WIDTH,
    borderRightWidth: 1,
    borderRightColor: Colors.border,
  },
  labelHeaderCell: {
    backgroundColor: Colors.gray100,
  },
  labelCell: {
    height: ROW_HEIGHT,
    justifyContent: 'center',
    paddingHorizontal: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Colors.border,
  },
  labelText: {
    fontSize: 12,
    color: Colors.gray700,
    fontWeight: '500',
    lineHeight: 16,
  },
  scrollArea: {
    flex: 1,
  },
  dataColumn: {
    width: COL_WIDTH,
    borderRightWidth: StyleSheet.hairlineWidth,
    borderRightColor: Colors.border,
  },
  headerCell: {
    height: 72,
    backgroundColor: Colors.gray100,
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingHorizontal: 8,
    paddingTop: 8,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  headerContent: {
    flex: 1,
    gap: 4,
  },
  headerName: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.text,
    lineHeight: 16,
  },
  codeBadge: {
    alignSelf: 'flex-start',
    backgroundColor: Colors.primaryLight,
    borderRadius: 4,
    paddingHorizontal: 5,
    paddingVertical: 2,
  },
  codeBadgeText: {
    fontSize: 10,
    fontWeight: '600',
    color: Colors.primary,
  },
  removeButton: {
    padding: 4,
    marginLeft: 2,
  },
  dataCell: {
    height: ROW_HEIGHT,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Colors.border,
  },
  bestCell: {
    backgroundColor: Colors.successLight,
  },
  cellText: {
    fontSize: 13,
    color: Colors.text,
    textAlign: 'center',
  },
  bestCellText: {
    fontWeight: '700',
    color: Colors.success,
  },
  naText: {
    color: Colors.gray400,
  },
});
