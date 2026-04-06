import React from 'react';
import { StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import FavoritesList from '@/components/favorites/FavoritesList';
import { Colors } from '@/constants/colors';

export default function FavoritesScreen() {
  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <FavoritesList />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
});
