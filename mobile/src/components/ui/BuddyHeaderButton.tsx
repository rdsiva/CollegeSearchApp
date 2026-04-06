import React from 'react';
import { TouchableOpacity, StyleSheet, Text, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { Colors } from '@/constants/colors';
import { useChat } from '@/context/ChatContext';
import { useCompare } from '@/context/CompareContext';

export default function BuddyHeaderButton() {
  const { openGeneral } = useChat();
  const { compareList } = useCompare();
  const compareActive = compareList.length > 0;

  return (
    <TouchableOpacity
      onPress={openGeneral}
      style={styles.btn}
      accessibilityLabel="Open College Buddy chat"
      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
    >
      <Feather
        name={compareActive ? 'message-square' : 'message-circle'}
        size={20}
        color={Colors.white}
      />
      <Text style={styles.label}>Buddy</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  btn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginRight: 14,
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.4)',
  },
  label: {
    color: Colors.white,
    fontSize: 13,
    fontWeight: '600',
  },
});
