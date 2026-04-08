import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  FlatList,
  StyleSheet,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { Colors } from '@/constants/colors';

export const DISTRICTS = [
  'Ariyalur', 'Chennai', 'Coimbatore', 'Cuddalore', 'Dharmapuri',
  'Dindigul', 'Erode', 'Kanchipuram', 'Kanyakumari', 'Karur',
  'Krishnagiri', 'Madurai', 'Nagapattinam', 'Namakkal', 'Perambalur',
  'Pudukkottai', 'Ramanathapuram', 'Salem', 'Sivaganga', 'Thanjavur',
  'Theni', 'Thiruvarur', 'Thoothukudi', 'Tiruchirappalli', 'Tirunelveli',
  'Tirupur', 'Tiruvallur', 'Tiruvannamalai', 'Vellore', 'Villupuram',
  'Virudhunagar',
];

interface DistrictPickerProps {
  value: string | undefined;
  onChange: (district: string | undefined) => void;
}

export function DistrictPicker({ value, onChange }: DistrictPickerProps) {
  const [showModal, setShowModal] = useState(false);

  const select = (d: string | undefined) => {
    onChange(d);
    setShowModal(false);
  };

  return (
    <>
      <TouchableOpacity style={styles.trigger} onPress={() => setShowModal(true)} activeOpacity={0.7}>
        <Feather name="map-pin" size={13} color={value ? Colors.primary : Colors.gray400} />
        <Text style={[styles.triggerText, value && styles.triggerTextActive]} numberOfLines={1}>
          {value ?? 'All Districts'}
        </Text>
        <Feather name="chevron-down" size={13} color={value ? Colors.primary : Colors.gray400} />
      </TouchableOpacity>

      <Modal visible={showModal} animationType="slide" transparent onRequestClose={() => setShowModal(false)}>
        <View style={styles.overlay}>
          <View style={styles.sheet}>
            <View style={styles.header}>
              <Text style={styles.title}>Select District</Text>
              <TouchableOpacity onPress={() => setShowModal(false)}>
                <Feather name="x" size={20} color={Colors.gray500} />
              </TouchableOpacity>
            </View>
            <Text style={styles.subtitle}>Results include the selected district and nearby districts</Text>

            <FlatList
              data={[undefined, ...DISTRICTS]}
              keyExtractor={(item) => item ?? '__all__'}
              renderItem={({ item }) => {
                const isSelected = item === value || (item === undefined && !value);
                return (
                  <TouchableOpacity
                    style={[styles.item, isSelected && styles.itemSelected]}
                    onPress={() => select(item)}
                    activeOpacity={0.7}
                  >
                    <Feather
                      name={item === undefined ? 'globe' : 'map-pin'}
                      size={14}
                      color={isSelected ? Colors.primary : Colors.gray400}
                      style={styles.itemIcon}
                    />
                    <Text style={[styles.itemText, isSelected && styles.itemTextSelected]}>
                      {item ?? 'All Districts'}
                    </Text>
                    {isSelected && <Feather name="check" size={16} color={Colors.primary} />}
                  </TouchableOpacity>
                );
              }}
              showsVerticalScrollIndicator={false}
            />
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  trigger: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.white,
    alignSelf: 'flex-start',
  },
  triggerText: {
    fontSize: 13,
    color: Colors.gray500,
    maxWidth: 140,
  },
  triggerTextActive: {
    color: Colors.primary,
    fontWeight: '600',
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: Colors.white,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingTop: 20,
    paddingHorizontal: 20,
    paddingBottom: 32,
    maxHeight: '75%',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  title: {
    fontSize: 17,
    fontWeight: '700',
    color: Colors.text,
  },
  subtitle: {
    fontSize: 12,
    color: Colors.textMuted,
    marginBottom: 12,
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Colors.border,
  },
  itemSelected: {
    backgroundColor: Colors.primaryLight,
    borderRadius: 8,
    paddingHorizontal: 8,
    marginHorizontal: -8,
  },
  itemIcon: {
    marginRight: 10,
  },
  itemText: {
    flex: 1,
    fontSize: 14,
    color: Colors.text,
  },
  itemTextSelected: {
    color: Colors.primary,
    fontWeight: '600',
  },
});
