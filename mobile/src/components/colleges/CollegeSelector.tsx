import React, { useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/colors';
import type { CollegeMatch } from '@/types';

interface CollegeSelectorProps {
  matches: CollegeMatch[];
  selectedCodes: Set<string>;
  onToggle: (code: string) => void;
  onSelectAll: () => void;
  onDeselectAll: () => void;
  onResearch: () => void;
  isLoading: boolean;
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
          <Text style={styles.code}>{item.code}</Text>
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
  onResearch,
  isLoading,
}: CollegeSelectorProps) {
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

  const isResearchDisabled = selectedCodes.size === 0 || isLoading;

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>
          {matches.length} college{matches.length !== 1 ? 's' : ''} found
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

      {/* List */}
      <FlatList
        data={matches}
        renderItem={renderItem}
        keyExtractor={keyExtractor}
        scrollEnabled={false}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
      />

      {/* Footer */}
      <TouchableOpacity
        style={[styles.researchButton, isResearchDisabled && styles.researchButtonDisabled]}
        onPress={onResearch}
        disabled={isResearchDisabled}
        accessibilityLabel={`Research selected colleges, ${selectedCodes.size} selected`}
        hitSlop={{ top: 4, bottom: 4, left: 4, right: 4 }}
      >
        <Text style={styles.researchButtonText}>
          Research Selected ({selectedCodes.size})
        </Text>
      </TouchableOpacity>
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
  researchButton: {
    margin: 14,
    backgroundColor: Colors.primary,
    borderRadius: 8,
    paddingVertical: 13,
    alignItems: 'center',
  },
  researchButtonDisabled: {
    backgroundColor: Colors.gray300,
  },
  researchButtonText: {
    color: Colors.white,
    fontSize: 15,
    fontWeight: '700',
  },
});
