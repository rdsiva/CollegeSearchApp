import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { Colors } from '@/constants/colors';
import { ScoreBadge } from '@/components/ui/ScoreBadge';
import type { CollegeDetail } from '@/types';

interface FavoriteRowProps {
  college: CollegeDetail;
  onRemove: (code: string) => void;
  onNavigate: (college: CollegeDetail) => void;
  onToggleCompare: (college: CollegeDetail) => void;
  isInCompare: boolean;
  index: number;
}

export function FavoriteRow({
  college,
  onRemove,
  onNavigate,
  onToggleCompare,
  isInCompare,
  index,
}: FavoriteRowProps) {
  const isEven = index % 2 === 0;

  return (
    <TouchableOpacity
      style={[styles.row, { backgroundColor: isEven ? Colors.gray50 : Colors.white }]}
      onPress={() => onNavigate(college)}
      activeOpacity={0.7}
    >
      <View style={styles.content}>
        <Text style={styles.name} numberOfLines={1}>
          {college.name}
        </Text>
        <Text style={styles.meta} numberOfLines={1}>
          {college.district} · {college.affiliation}
        </Text>
        {college.selectedCourses && college.selectedCourses.length > 0 && (
          <View style={styles.branchBadgesRow}>
            {college.selectedCourses.slice(0, 2).map((branch) => (
              <View key={branch} style={styles.branchBadge}>
                <Text style={styles.branchBadgeText} numberOfLines={1}>{branch}</Text>
              </View>
            ))}
            {college.selectedCourses.length > 2 && (
              <View style={styles.branchBadge}>
                <Text style={styles.branchBadgeText}>+{college.selectedCourses.length - 2} more</Text>
              </View>
            )}
          </View>
        )}
        <View style={styles.rankRow}>
          {college.nirf_rank != null && (
            <Text style={styles.nirfText}>NIRF #{college.nirf_rank}</Text>
          )}
          <ScoreBadge score={college.score} size="sm" />
        </View>
      </View>
      <View style={styles.actions}>
        <TouchableOpacity
          onPress={() => onToggleCompare(college)}
          style={[styles.actionButton, isInCompare && styles.actionButtonActive]}
          accessibilityLabel={isInCompare ? 'Remove from compare' : 'Add to compare'}
        >
          <Feather
            name="columns"
            size={18}
            color={isInCompare ? Colors.primary : Colors.gray400}
          />
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => onRemove(college.code)}
          style={styles.actionButton}
          accessibilityLabel="Remove from favorites"
        >
          <Feather name="trash-2" size={18} color={Colors.danger} />
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Colors.border,
  },
  content: {
    flex: 1,
    marginRight: 8,
  },
  name: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.primary,
    marginBottom: 2,
  },
  meta: {
    fontSize: 12,
    color: Colors.gray500,
    marginBottom: 4,
  },
  branchBadgesRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
    marginBottom: 4,
  },
  branchBadge: {
    backgroundColor: Colors.primaryLight,
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
    maxWidth: 160,
  },
  branchBadgeText: {
    fontSize: 10,
    color: Colors.primary,
    fontWeight: '600',
  },
  rankRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  nirfText: {
    fontSize: 12,
    color: Colors.gray600,
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  actionButton: {
    padding: 8,
    borderRadius: 8,
  },
  actionButtonActive: {
    backgroundColor: Colors.primaryLight,
  },
});
