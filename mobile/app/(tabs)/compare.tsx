import React from 'react';
import { View, TouchableOpacity, Text, StyleSheet } from 'react-native';
import { useCompare } from '@/context/CompareContext';
import CompareTable from '@/components/compare/CompareTable';
import { EmptyState } from '@/components/ui/EmptyState';
import { Colors } from '@/constants/colors';

export default function CompareScreen() {
  const { compareList, clearCompare } = useCompare();

  return (
    <View style={styles.container}>
      {compareList.length > 0 && (
        <View style={styles.header}>
          <Text style={styles.headerCount}>
            {compareList.length} college{compareList.length !== 1 ? 's' : ''}
          </Text>
          <TouchableOpacity onPress={clearCompare} style={styles.clearButton}>
            <Text style={styles.clearButtonText}>Clear All</Text>
          </TouchableOpacity>
        </View>
      )}
      {compareList.length < 2 ? (
        <EmptyState
          icon="columns"
          title="Nothing to compare yet"
          subtitle="Add 2+ colleges to compare. Use the Compare button on any college card or in your Favorites."
        />
      ) : (
        <CompareTable />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: Colors.white,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Colors.border,
  },
  headerCount: {
    fontSize: 14,
    color: Colors.textSecondary,
    fontWeight: '500',
  },
  clearButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.danger,
  },
  clearButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.danger,
  },
});
