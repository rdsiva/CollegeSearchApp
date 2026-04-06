import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Colors } from '@/constants/colors';
import { useCompare } from '@/context/CompareContext';

export default function CompareFloatingBar() {
  const router = useRouter();
  const { compareList, removeFromCompare, clearCompare } = useCompare();

  if (compareList.length === 0) return null;

  const handleCompareNow = () => {
    router.push('/(tabs)/compare');
  };

  return (
    <View style={styles.bar}>
      {/* Chips scroll area */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.chipsContent}
        style={styles.chipsScroll}
      >
        {compareList.map((college) => (
          <View key={college.code} style={styles.chip}>
            <Text style={styles.chipText} numberOfLines={1}>
              {college.name}
            </Text>
            <TouchableOpacity
              onPress={() => removeFromCompare(college.code)}
              accessibilityLabel={`Remove ${college.name} from compare`}
              hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
              style={styles.chipRemove}
            >
              <Feather name="x" size={12} color={Colors.white} />
            </TouchableOpacity>
          </View>
        ))}
      </ScrollView>

      {/* Actions */}
      <View style={styles.actions}>
        <TouchableOpacity
          style={styles.compareBtn}
          onPress={handleCompareNow}
          accessibilityLabel={`Compare now, ${compareList.length} colleges selected`}
          hitSlop={{ top: 4, bottom: 4, left: 4, right: 4 }}
        >
          <Text style={styles.compareBtnText}>
            Compare ({compareList.length})
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.clearBtn}
          onPress={clearCompare}
          accessibilityLabel="Clear compare list"
          hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
        >
          <Feather name="trash-2" size={16} color={Colors.gray300} />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: Colors.gray800,
    paddingTop: 10,
    paddingBottom: 14,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 10,
  },
  chipsScroll: {
    flex: 1,
  },
  chipsContent: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primary,
    borderRadius: 14,
    paddingLeft: 10,
    paddingRight: 6,
    paddingVertical: 5,
    gap: 5,
    maxWidth: 160,
  },
  chipText: {
    fontSize: 12,
    color: Colors.white,
    fontWeight: '600',
    flexShrink: 1,
  },
  chipRemove: {
    width: 16,
    height: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  compareBtn: {
    backgroundColor: Colors.primary,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  compareBtnText: {
    color: Colors.white,
    fontSize: 13,
    fontWeight: '700',
  },
  clearBtn: {
    padding: 6,
  },
});
