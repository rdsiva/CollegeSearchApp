import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  useWindowDimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Feather } from '@expo/vector-icons';
import { Colors } from '@/constants/colors';
import type { CollegeMatch } from '@/types';

const MAX_RESEARCH = 5;
// Each row is ~115dp; subtract ~380dp for search bar + header + safe area + floating bars
function getPageSize(screenHeight: number) {
  return Math.max(3, Math.min(8, Math.floor((screenHeight - 380) / 115)));
}

interface CollegeSelectorProps {
  matches: CollegeMatch[];
  selectedCodes: Set<string>;
  onToggle: (code: string) => void;
  onSelectAll: () => void;
  onDeselectAll: () => void;
}

const MAX_PILLS = 4;

interface RowProps {
  item: CollegeMatch;
  isSelected: boolean;
  onToggle: (code: string) => void;
}

function CollegeRow({ item, isSelected, onToggle }: RowProps) {
  const visibleCourses = item.courses.slice(0, MAX_PILLS);
  const overflow = item.courses.length - MAX_PILLS;

  return (
    <TouchableOpacity
      style={styles.row}
      onPress={() => onToggle(item.code)}
      accessibilityLabel={`${isSelected ? 'Deselect' : 'Select'} ${item.name}`}
      accessibilityRole="checkbox"
      accessibilityState={{ checked: isSelected }}
      hitSlop={{ top: 4, bottom: 4, left: 4, right: 4 }}
    >
      <Ionicons
        name={isSelected ? 'checkbox' : 'square-outline'}
        size={22}
        color={isSelected ? Colors.primary : Colors.gray400}
        style={styles.checkbox}
      />
      <View style={styles.rowContent}>
        <View style={styles.nameRow}>
          <Text style={styles.collegeName} numberOfLines={2}>
            {item.name}
          </Text>
          <View style={styles.badgesRow}>
            {item.nirf_rank != null && (
              <View style={styles.nirfBadge}>
                <Text style={styles.nirfBadgeText}>#{item.nirf_rank}</Text>
              </View>
            )}
            <Text style={styles.code}>{item.code}</Text>
          </View>
        </View>
        <Text style={styles.location} numberOfLines={1}>
          {item.city}, {item.district}
        </Text>
        <Text style={styles.affiliation} numberOfLines={1}>
          {item.affiliation}
        </Text>
        {item.courses.length > 0 && (
          <View style={styles.pillsRow}>
            {visibleCourses.map((course) => (
              <View key={course} style={styles.pill}>
                <Text style={styles.pillText} numberOfLines={1}>
                  {course}
                </Text>
              </View>
            ))}
            {overflow > 0 && (
              <View style={styles.pill}>
                <Text style={styles.pillText}>+{overflow}</Text>
              </View>
            )}
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
}

export default function CollegeSelector({
  matches,
  selectedCodes,
  onToggle,
  onSelectAll,
  onDeselectAll,
}: CollegeSelectorProps) {
  const { height } = useWindowDimensions();
  const PAGE_SIZE = getPageSize(height);
  const [page, setPage] = useState(0);
  const totalPages = Math.ceil(matches.length / PAGE_SIZE);
  const visible = matches.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);
  const overLimit = selectedCodes.size > MAX_RESEARCH;

  const renderItem = useCallback(
    ({ item }: { item: CollegeMatch }) => (
      <CollegeRow
        item={item}
        isSelected={selectedCodes.has(item.code)}
        onToggle={onToggle}
      />
    ),
    [selectedCodes, onToggle]
  );

  const keyExtractor = useCallback((item: CollegeMatch) => item.code, []);

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>
          {matches.length} college{matches.length !== 1 ? 's' : ''} found
          {totalPages > 1 && (
            <Text style={styles.pageInfo}> · page {page + 1}/{totalPages}</Text>
          )}
        </Text>
        <View style={styles.headerActions}>
          <TouchableOpacity
            onPress={onSelectAll}
            style={styles.headerBtn}
            hitSlop={{ top: 4, bottom: 4, left: 4, right: 4 }}
            accessibilityLabel="Select all colleges"
          >
            <Text style={styles.headerBtnText}>Select All</Text>
          </TouchableOpacity>
          <Text style={styles.headerBtnSep}>|</Text>
          <TouchableOpacity
            onPress={onDeselectAll}
            style={styles.headerBtn}
            hitSlop={{ top: 4, bottom: 4, left: 4, right: 4 }}
            accessibilityLabel="Deselect all colleges"
          >
            <Text style={styles.headerBtnText}>Deselect All</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Over-limit warning */}
      {overLimit && (
        <View style={styles.limitWarning}>
          <Feather name="alert-triangle" size={13} color={Colors.warning} />
          <Text style={styles.limitWarningText}>
            Only {MAX_RESEARCH} colleges will be researched at a time
          </Text>
        </View>
      )}

      {/* List (current page only) */}
      <FlatList
        data={visible}
        renderItem={renderItem}
        keyExtractor={keyExtractor}
        scrollEnabled={false}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
      />

      {/* Pagination controls */}
      {totalPages > 1 && (
        <View style={styles.pagination}>
          <TouchableOpacity
            style={[styles.pageBtn, page === 0 && styles.pageBtnDisabled]}
            onPress={() => setPage((p) => p - 1)}
            disabled={page === 0}
            hitSlop={{ top: 4, bottom: 4, left: 8, right: 8 }}
          >
            <Feather name="chevron-left" size={16} color={page === 0 ? Colors.gray300 : Colors.primary} />
            <Text style={[styles.pageBtnText, page === 0 && styles.pageBtnTextDisabled]}>Prev</Text>
          </TouchableOpacity>

          <Text style={styles.pageRange}>
            {page * PAGE_SIZE + 1}–{Math.min((page + 1) * PAGE_SIZE, matches.length)} of {matches.length}
          </Text>

          <TouchableOpacity
            style={[styles.pageBtn, page >= totalPages - 1 && styles.pageBtnDisabled]}
            onPress={() => setPage((p) => p + 1)}
            disabled={page >= totalPages - 1}
            hitSlop={{ top: 4, bottom: 4, left: 8, right: 8 }}
          >
            <Text style={[styles.pageBtnText, page >= totalPages - 1 && styles.pageBtnTextDisabled]}>Next</Text>
            <Feather name="chevron-right" size={16} color={page >= totalPages - 1 ? Colors.gray300 : Colors.primary} />
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.card,
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 12,
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 3,
    elevation: 2,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    backgroundColor: Colors.gray50,
  },
  headerTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.gray700,
  },
  pageInfo: {
    fontSize: 12,
    fontWeight: '400',
    color: Colors.gray400,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  headerBtn: {
    paddingVertical: 2,
  },
  headerBtnText: {
    fontSize: 13,
    color: Colors.primary,
    fontWeight: '600',
  },
  headerBtnSep: {
    fontSize: 13,
    color: Colors.gray300,
  },
  limitWarning: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    backgroundColor: Colors.warningLight,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  limitWarningText: {
    fontSize: 12,
    color: Colors.warning,
    fontWeight: '500',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  checkbox: {
    marginTop: 2,
    marginRight: 10,
  },
  rowContent: {
    flex: 1,
  },
  nameRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 8,
    marginBottom: 2,
  },
  collegeName: {
    flex: 1,
    fontSize: 14,
    fontWeight: '700',
    color: Colors.text,
    lineHeight: 20,
  },
  badgesRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  nirfBadge: {
    backgroundColor: Colors.primaryLight,
    borderRadius: 4,
    paddingHorizontal: 5,
    paddingVertical: 2,
  },
  nirfBadgeText: {
    fontSize: 10,
    color: Colors.primary,
    fontWeight: '700',
  },
  code: {
    fontSize: 12,
    color: Colors.textSecondary,
    fontFamily: 'monospace',
    marginTop: 2,
  },
  location: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginBottom: 1,
  },
  affiliation: {
    fontSize: 12,
    color: Colors.textMuted,
    marginBottom: 6,
  },
  pillsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
  },
  pill: {
    backgroundColor: Colors.gray100,
    borderRadius: 10,
    paddingHorizontal: 7,
    paddingVertical: 2,
  },
  pillText: {
    fontSize: 11,
    color: Colors.gray600,
  },
  separator: {
    height: 1,
    backgroundColor: Colors.border,
    marginLeft: 46,
  },
  pagination: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: Colors.border,
    backgroundColor: Colors.gray50,
  },
  pageBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.white,
  },
  pageBtnDisabled: {
    backgroundColor: Colors.gray50,
    borderColor: Colors.gray200,
  },
  pageBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.primary,
  },
  pageBtnTextDisabled: {
    color: Colors.gray300,
  },
  pageRange: {
    fontSize: 12,
    color: Colors.textSecondary,
    tabularNums: true,
  },
});
