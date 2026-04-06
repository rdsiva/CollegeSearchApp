import React from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSession } from '@/context/SessionContext';
import { useCompare } from '@/context/CompareContext';
import { useFavoriteExport } from '@/hooks/useFavoriteExport';
import { FavoriteRow } from './FavoriteRow';
import { EmptyState } from '@/components/ui/EmptyState';
import { ErrorBanner } from '@/components/ui/ErrorBanner';
import { Colors } from '@/constants/colors';
import type { CollegeDetail } from '@/types';

export default function FavoritesList() {
  const router = useRouter();
  const { favorites, removeFromFavorites, clearFavorites } = useSession();
  const { addToCompare, removeFromCompare, isInCompare, isFull } = useCompare();
  const { exporting, exportError, handleExportCsv, handleExportWord } = useFavoriteExport();

  const handleNavigate = (college: CollegeDetail) => {
    router.push({
      pathname: '/college/[code]',
      params: { code: college.code, data: JSON.stringify(college) },
    });
  };

  const handleToggleCompare = (college: CollegeDetail) => {
    if (isInCompare(college.code)) {
      removeFromCompare(college.code);
    } else {
      if (isFull()) {
        Alert.alert('Compare Full', 'You can compare up to 5 colleges at a time. Remove one to add another.');
        return;
      }
      addToCompare(college);
    }
  };

  const handleClearAll = () => {
    Alert.alert(
      'Clear Favorites',
      'Remove all colleges from your favorites?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Clear All', style: 'destructive', onPress: clearFavorites },
      ]
    );
  };

  if (favorites.length === 0) {
    return (
      <EmptyState
        icon="star"
        title="No favorites yet"
        subtitle="Tap the star icon on any college to save it here."
      />
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.toolbar}>
        <TouchableOpacity
          style={[styles.toolbarButton, exporting === 'csv' && styles.toolbarButtonDisabled]}
          onPress={() => handleExportCsv(favorites)}
          disabled={exporting !== null}
        >
          {exporting === 'csv' ? (
            <ActivityIndicator size="small" color={Colors.primary} />
          ) : (
            <Text style={styles.toolbarButtonText}>Export CSV</Text>
          )}
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.toolbarButton, exporting === 'word' && styles.toolbarButtonDisabled]}
          onPress={() => handleExportWord(favorites)}
          disabled={exporting !== null}
        >
          {exporting === 'word' ? (
            <ActivityIndicator size="small" color={Colors.primary} />
          ) : (
            <Text style={styles.toolbarButtonText}>Export Word</Text>
          )}
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.toolbarButton, styles.toolbarButtonDanger]}
          onPress={handleClearAll}
          disabled={exporting !== null}
        >
          <Text style={styles.toolbarButtonTextDanger}>Clear All</Text>
        </TouchableOpacity>
      </View>
      {exportError != null && (
        <ErrorBanner message={exportError} />
      )}
      <FlatList
        data={favorites}
        keyExtractor={(item) => item.code}
        renderItem={({ item, index }) => (
          <FavoriteRow
            college={item}
            onRemove={removeFromFavorites}
            onNavigate={handleNavigate}
            onToggleCompare={handleToggleCompare}
            isInCompare={isInCompare(item.code)}
            index={index}
          />
        )}
        contentContainerStyle={styles.list}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  toolbar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Colors.border,
    backgroundColor: Colors.white,
  },
  toolbarButton: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 90,
    minHeight: 34,
  },
  toolbarButtonDisabled: {
    opacity: 0.6,
  },
  toolbarButtonDanger: {
    borderColor: Colors.danger,
    marginLeft: 'auto',
  },
  toolbarButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.primary,
  },
  toolbarButtonTextDanger: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.danger,
  },
  list: {
    paddingBottom: 20,
  },
});
