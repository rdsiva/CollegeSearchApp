import React from 'react';
import { TouchableOpacity, StyleSheet, Text } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { Colors } from '@/constants/colors';
import { useChat } from '@/context/ChatContext';
import { useCompare } from '@/context/CompareContext';

export default function BuddyFab() {
  const { openGeneral } = useChat();
  const { compareList } = useCompare();
  const compareActive = compareList.length > 0;

  return (
    <TouchableOpacity
      style={[styles.fab, compareActive && styles.fabCompareMode]}
      onPress={openGeneral}
      accessibilityLabel="Open College Buddy chat"
      activeOpacity={0.85}
    >
      <Feather
        name={compareActive ? 'message-square' : 'message-circle'}
        size={22}
        color={Colors.white}
      />
      <Text style={styles.label}>Buddy</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  fab: {
    position: 'absolute',
    bottom: 74,
    right: 16,
    backgroundColor: Colors.primary,
    borderRadius: 28,
    paddingHorizontal: 14,
    paddingVertical: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    elevation: 12,
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
  },
  fabCompareMode: {
    backgroundColor: Colors.warning,
  },
  label: {
    color: Colors.white,
    fontSize: 13,
    fontWeight: '700',
  },
});
