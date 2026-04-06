import React from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useSearch } from '@/hooks/useSearch';
import SearchBar from '@/components/search/SearchBar';
import CollegeSelector from '@/components/colleges/CollegeSelector';
import CollegeCard from '@/components/colleges/CollegeCard';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { EmptyState } from '@/components/ui/EmptyState';
import { ErrorBanner } from '@/components/ui/ErrorBanner';
import CompareFloatingBar from '@/components/compare/CompareFloatingBar';
import ResearchFloatingBar from '@/components/search/ResearchFloatingBar';
import { useSession } from '@/context/SessionContext';
import { useCompare } from '@/context/CompareContext';
import { Colors } from '@/constants/colors';

const COMPARE_BAR_HEIGHT = 70;
const RESEARCH_BAR_HEIGHT = 66;

export default function SearchScreen() {
  const search = useSearch();
  const { addManyToFavorites } = useSession();
  const { compareList } = useCompare();
  const compareBarPad = compareList.length > 0 ? COMPARE_BAR_HEIGHT : 0;
  const researchBarPad = search.phase === 'selecting' ? RESEARCH_BAR_HEIGHT : 0;
  const extraPad = compareBarPad + researchBarPad;

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingBottom: 80 + extraPad }]}
        keyboardShouldPersistTaps="handled"
      >
        <SearchBar onSearch={search.handleSearch} />

        {search.error && (
          <ErrorBanner message={search.error} onDismiss={search.reset} />
        )}

        {search.phase === 'searching' && <LoadingSpinner label="Searching..." />}
        {search.phase === 'researching' && (
          <LoadingSpinner label="Researching colleges..." />
        )}

        {search.phase === 'selecting' && (
          <CollegeSelector
            matches={search.matches}
            selectedCodes={search.selectedCodes}
            onToggle={search.toggleCode}
            onSelectAll={search.selectAll}
            onDeselectAll={search.deselectAll}
          />
        )}

        {search.phase === 'results' && search.results.length > 0 && (
          <View>
            <View style={styles.resultsHeader}>
              <Text style={styles.resultsTitle}>
                {search.results.length} college{search.results.length !== 1 ? 's' : ''} researched
              </Text>
              <TouchableOpacity
                onPress={() => addManyToFavorites(search.results)}
                hitSlop={{ top: 4, bottom: 4, left: 4, right: 4 }}
                accessibilityLabel="Add all to favorites"
              >
                <Text style={styles.addAllBtn}>★ Add All to Favorites</Text>
              </TouchableOpacity>
            </View>
            {search.results.map((college) => (
              <CollegeCard key={college.code} college={college} />
            ))}
          </View>
        )}

        {search.phase === 'idle' && !search.error && (
          <EmptyState
            icon="search"
            title="Search Tamil Nadu Engineering Colleges"
            subtitle="Search by college name, TNEA code, or your cutoff marks"
          />
        )}
      </ScrollView>
      {search.phase === 'selecting' && (
        <ResearchFloatingBar
          selectedCount={search.selectedCodes.size}
          totalCount={search.matches.length}
          onResearch={search.handleResearch}
          isLoading={search.phase === 'researching'}
          bottomOffset={compareBarPad}
        />
      )}
      <CompareFloatingBar />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scroll: {
    padding: 16,
  },
  resultsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  resultsTitle: {
    fontSize: 14,
    color: Colors.textSecondary,
    fontWeight: '500',
  },
  addAllBtn: {
    fontSize: 13,
    color: Colors.primary,
    fontWeight: '600',
  },
});
