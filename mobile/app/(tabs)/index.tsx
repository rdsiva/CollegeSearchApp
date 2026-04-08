import React from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
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
const RESEARCH_BAR_HEIGHT = 76; // slightly taller to fit limit warning

export default function SearchScreen() {
  const search = useSearch();
  const { addManyToFavorites } = useSession();
  const { compareList } = useCompare();
  const compareBarPad = compareList.length > 0 ? COMPARE_BAR_HEIGHT : 0;
  const researchBarPad = search.phase === 'selecting' ? RESEARCH_BAR_HEIGHT : 0;
  const extraPad = compareBarPad + researchBarPad;

  const showResearched = search.researchedColleges.length > 0;

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

        {search.phase === 'idle' && !search.error && !showResearched && (
          <EmptyState
            icon="search"
            title="Search Tamil Nadu Engineering Colleges"
            subtitle="Search by college name, TNEA code, or your cutoff marks"
          />
        )}

        {/* Persisted researched colleges — session cache */}
        {showResearched && search.phase !== 'researching' && (
          <View style={styles.researchedSection}>
            {/* Section header */}
            <View style={styles.researchedHeader}>
              <View style={styles.researchedTitleRow}>
                <Feather name="layers" size={14} color={Colors.primary} />
                <Text style={styles.researchedTitle}>
                  Researched ({search.researchedColleges.length})
                </Text>
                <View style={styles.sessionBadge}>
                  <Text style={styles.sessionBadgeText}>This session</Text>
                </View>
              </View>
              <View style={styles.researchedActions}>
                <TouchableOpacity
                  onPress={() => addManyToFavorites(search.researchedColleges)}
                  hitSlop={{ top: 4, bottom: 4, left: 4, right: 4 }}
                  style={styles.actionBtn}
                >
                  <Feather name="star" size={13} color={Colors.warning} />
                  <Text style={[styles.actionBtnText, { color: Colors.warning }]}>Add All</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={search.clearResearched}
                  hitSlop={{ top: 4, bottom: 4, left: 4, right: 4 }}
                  style={styles.actionBtn}
                >
                  <Feather name="trash-2" size={13} color={Colors.gray400} />
                  <Text style={[styles.actionBtnText, { color: Colors.gray500 }]}>Clear</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Cards */}
            {search.researchedColleges.map((college) => (
              <CollegeCard key={college.code} college={college} />
            ))}
          </View>
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
  researchedSection: {
    marginTop: 4,
  },
  researchedHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
    flexWrap: 'wrap',
    gap: 8,
  },
  researchedTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  researchedTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.text,
  },
  sessionBadge: {
    backgroundColor: Colors.primaryLight,
    borderRadius: 10,
    paddingHorizontal: 7,
    paddingVertical: 2,
  },
  sessionBadgeText: {
    fontSize: 10,
    color: Colors.primary,
    fontWeight: '600',
  },
  researchedActions: {
    flexDirection: 'row',
    gap: 10,
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  actionBtnText: {
    fontSize: 13,
    fontWeight: '600',
  },
});
