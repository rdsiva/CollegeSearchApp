import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { Colors } from '@/constants/colors';

const MAX_RESEARCH = 5;

interface ResearchFloatingBarProps {
  selectedCount: number;
  totalCount: number;
  onResearch: () => void;
  isLoading: boolean;
  bottomOffset: number;
}

export default function ResearchFloatingBar({
  selectedCount,
  totalCount,
  onResearch,
  isLoading,
  bottomOffset,
}: ResearchFloatingBarProps) {
  const overLimit = selectedCount > MAX_RESEARCH;
  const researchCount = Math.min(selectedCount, MAX_RESEARCH);

  return (
    <View style={[styles.bar, { bottom: bottomOffset }]}>
      <View style={styles.left}>
        <Text style={styles.countText}>
          {selectedCount} of {totalCount} selected
        </Text>
        {overLimit && (
          <View style={styles.limitRow}>
            <Feather name="alert-triangle" size={11} color={Colors.warning} />
            <Text style={styles.limitText}>Max {MAX_RESEARCH} per research batch</Text>
          </View>
        )}
      </View>
      <TouchableOpacity
        style={[
          styles.researchBtn,
          (selectedCount === 0 || isLoading) && styles.researchBtnDisabled,
        ]}
        onPress={onResearch}
        disabled={selectedCount === 0 || isLoading}
        accessibilityLabel={`Research ${researchCount} selected colleges`}
        hitSlop={{ top: 4, bottom: 4, left: 4, right: 4 }}
      >
        {isLoading ? (
          <ActivityIndicator size="small" color={Colors.white} />
        ) : (
          <>
            <Feather name="zoom-in" size={15} color={Colors.white} />
            <Text style={styles.researchBtnText}>
              Research ({researchCount}{overLimit ? ` of ${selectedCount}` : ''})
            </Text>
          </>
        )}
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    position: 'absolute',
    left: 0,
    right: 0,
    backgroundColor: Colors.white,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 10,
  },
  left: {
    flex: 1,
    marginRight: 12,
  },
  countText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  limitRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
  },
  limitText: {
    fontSize: 11,
    color: Colors.warning,
  },
  researchBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    backgroundColor: Colors.primary,
    borderRadius: 10,
    paddingHorizontal: 18,
    paddingVertical: 11,
  },
  researchBtnDisabled: {
    backgroundColor: Colors.gray300,
  },
  researchBtnText: {
    color: Colors.white,
    fontSize: 14,
    fontWeight: '700',
  },
});
