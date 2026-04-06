import React from 'react';
import { View, StyleSheet } from 'react-native';
import ChatScreen from '@/components/chat/ChatScreen';
import { Colors } from '@/constants/colors';

export default function ChatModal() {
  return (
    <View style={styles.container}>
      <ChatScreen />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.white },
});
