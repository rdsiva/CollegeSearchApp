import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { Colors } from '@/constants/colors';
import { CATEGORIES } from '@/constants/search';
import type { CollegeDetail, CourseDetail, CutoffMap } from '@/types';

interface CutoffsTableProps {
  college: CollegeDetail;
}

type ActiveYear = '2026' | '2025' | '2024';

const TABS: { label: string; value: ActiveYear }[] = [
  { label: '2026 Predicted', value: '2026' },
  { label: '2025 Expected', value: '2025' },
  { label: '2024 Actual', value: '2024' },
];

const CATEGORY_COL_WIDTH = 52;
const BRANCH_COL_WIDTH = 140;
const ROW_HEIGHT = 44;

function getActiveCutoffs(course: CourseDetail, year: ActiveYear): CutoffMap | undefined {
  if (year === '2026') return course.cutoffs_2026_predicted;
  if (year === '2025') return course.cutoffs_2025;
  return course.cutoffs;
}

export function CutoffsTable({ college }: CutoffsTableProps) {
  const [activeYear, setActiveYear] = useState<ActiveYear>('2026');
  const courses = college.courses;

  if (!courses || courses.length === 0) return null;

  return (
    <View style={styles.container}>
      {/* Year tabs */}
      <View style={styles.tabRow}>
        {TABS.map((tab) => (
          <TouchableOpacity
            key={tab.value}
            style={[styles.tab, activeYear === tab.value && styles.tabActive]}
            onPress={() => setActiveYear(tab.value)}
          >
            <Text
              style={[styles.tabText, activeYear === tab.value && styles.tabTextActive]}
            >
              {tab.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Table */}
      <View style={styles.tableWrapper}>
        {/* Fixed left column */}
        <View style={{ width: BRANCH_COL_WIDTH }}>
          <View style={[styles.headerCell, { width: BRANCH_COL_WIDTH, height: ROW_HEIGHT }]}>
            <Text style={styles.headerText}>Branch</Text>
          </View>
          {courses.map((course, idx) => (
            <View
              key={course.branch_code}
              style={[
                styles.cell,
                { width: BRANCH_COL_WIDTH, height: ROW_HEIGHT },
                idx % 2 === 1 && styles.rowAlt,
              ]}
            >
              <Text style={styles.branchText} numberOfLines={2}>
                {course.branch_name}
              </Text>
            </View>
          ))}
        </View>

        {/* Scrollable category columns */}
        <ScrollView horizontal showsHorizontalScrollIndicator>
          <View>
            {/* Header row */}
            <View style={styles.headerRow}>
              {CATEGORIES.map((cat) => (
                <View
                  key={cat}
                  style={[styles.headerCell, { width: CATEGORY_COL_WIDTH, height: ROW_HEIGHT }]}
                >
                  <Text style={styles.headerText}>{cat}</Text>
                </View>
              ))}
            </View>

            {/* Data rows */}
            {courses.map((course, idx) => {
              const cutoffs = getActiveCutoffs(course, activeYear);
              return (
                <View key={course.branch_code} style={styles.dataRow}>
                  {CATEGORIES.map((cat) => {
                    const val = cutoffs?.[cat];
                    return (
                      <View
                        key={cat}
                        style={[
                          styles.cell,
                          { width: CATEGORY_COL_WIDTH, height: ROW_HEIGHT },
                          idx % 2 === 1 && styles.rowAlt,
                        ]}
                      >
                        <Text style={styles.cellText}>{val != null ? val : '—'}</Text>
                      </View>
                    );
                  })}
                </View>
              );
            })}
          </View>
        </ScrollView>
      </View>

      {/* AI prediction note */}
      {activeYear === '2026' && (
        <Text style={styles.note}>
          * 2026 cutoffs are AI-predicted based on 2024–2025 trends
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 10,
  },
  tabRow: {
    flexDirection: 'row',
    gap: 6,
  },
  tab: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 4,
    borderRadius: 8,
    backgroundColor: Colors.gray100,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  tabActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  tabText: {
    fontSize: 11,
    fontWeight: '500',
    color: Colors.gray600,
    textAlign: 'center',
  },
  tabTextActive: {
    color: Colors.white,
    fontWeight: '700',
  },
  tableWrapper: {
    flexDirection: 'row',
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 8,
    overflow: 'hidden',
  },
  headerRow: {
    flexDirection: 'row',
  },
  dataRow: {
    flexDirection: 'row',
  },
  headerCell: {
    backgroundColor: Colors.gray100,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    borderRightWidth: 1,
    borderRightColor: Colors.border,
  },
  headerText: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.gray700,
    textAlign: 'center',
  },
  cell: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
    backgroundColor: Colors.white,
    borderBottomWidth: 1,
    borderBottomColor: Colors.gray100,
    borderRightWidth: 1,
    borderRightColor: Colors.gray100,
  },
  rowAlt: {
    backgroundColor: Colors.gray50,
  },
  branchText: {
    fontSize: 11,
    color: Colors.text,
    textAlign: 'left',
    paddingHorizontal: 6,
  },
  cellText: {
    fontSize: 11,
    color: Colors.gray700,
    textAlign: 'center',
  },
  note: {
    fontSize: 11,
    color: Colors.textMuted,
    fontStyle: 'italic',
  },
});
