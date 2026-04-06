import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { Colors } from '@/constants/colors';

interface ErrorBannerProps {
  message: string;
  onDismiss?: () => void;
}

export function ErrorBanner({ message, onDismiss }: ErrorBannerProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.message} numberOfLines={3}>
        {message}
      </Text>
      {onDismiss ? (
        <TouchableOpacity onPress={onDismiss} style={styles.dismissButton} accessibilityLabel="Dismiss error">
          <Feather name="x" size={16} color={Colors.white} />
        </TouchableOpacity>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.danger,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 8,
    margin: 12,
  },
  message: {
    flex: 1,
    color: Colors.white,
    fontSize: 13,
    lineHeight: 18,
  },
  dismissButton: {
    marginLeft: 10,
    padding: 4,
  },
});
