import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { Colors } from '@/constants/colors';
import type { SearchParams, SearchMode } from '@/types';
import CutoffSearchForm from './CutoffSearchForm';

interface SearchBarProps {
  onSearch: (params: SearchParams) => void;
}

const MODES: { label: string; value: SearchMode }[] = [
  { label: 'By Name', value: 'name' },
  { label: 'By Code', value: 'code' },
  { label: 'By Cutoff', value: 'cutoff' },
];

export default function SearchBar({ onSearch }: SearchBarProps) {
  const [mode, setMode] = useState<SearchMode>('name');
  const [query, setQuery] = useState<string>('');

  const handleTextSearch = () => {
    let q = query.trim();
    if (q === '') return;
    // M2: cap query length; sanitize code to alphanumeric only to prevent injection
    if (mode === 'code') {
      q = q.replace(/[^A-Za-z0-9]/g, '').slice(0, 20);
    } else {
      q = q.slice(0, 200);
    }
    if (q === '') return;
    onSearch({ type: mode, q });
  };

  return (
    <View style={styles.container}>
      {/* Mode tabs */}
      <View style={styles.tabs}>
        {MODES.map((m) => (
          <TouchableOpacity
            key={m.value}
            style={[styles.tab, mode === m.value && styles.tabActive]}
            onPress={() => {
              setMode(m.value);
              setQuery('');
            }}
            accessibilityLabel={`Search ${m.label}`}
            hitSlop={{ top: 4, bottom: 4, left: 4, right: 4 }}
          >
            <Text style={[styles.tabText, mode === m.value && styles.tabTextActive]}>
              {m.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Text input modes */}
      {(mode === 'name' || mode === 'code') && (
        <View style={styles.inputRow}>
          <View style={styles.inputWrapper}>
            <Feather
              name="search"
              size={16}
              color={Colors.textMuted}
              style={styles.inputIcon}
            />
            <TextInput
              style={styles.textInput}
              value={query}
              onChangeText={setQuery}
              onSubmitEditing={handleTextSearch}
              placeholder={
                mode === 'name'
                  ? 'Search by college name...'
                  : 'Enter TNEA code (e.g. 1234)...'
              }
              placeholderTextColor={Colors.textMuted}
              returnKeyType="search"
              autoCorrect={false}
              autoCapitalize="none"
              accessibilityLabel={mode === 'name' ? 'College name input' : 'College code input'}
            />
          </View>
          <TouchableOpacity
            style={[styles.searchButton, query.trim() === '' && styles.searchButtonDisabled]}
            onPress={handleTextSearch}
            disabled={query.trim() === ''}
            accessibilityLabel="Search"
            hitSlop={{ top: 4, bottom: 4, left: 4, right: 4 }}
          >
            <Text style={styles.searchButtonText}>Search</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Cutoff form */}
      {mode === 'cutoff' && <CutoffSearchForm onSearch={onSearch} />}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.card,
    borderRadius: 12,
    padding: 14,
    marginBottom: 12,
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 3,
    elevation: 2,
  },
  tabs: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  tab: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: Colors.gray100,
    alignItems: 'center',
  },
  tabActive: {
    backgroundColor: Colors.primary,
  },
  tabText: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.gray600,
  },
  tabTextActive: {
    color: Colors.white,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  inputWrapper: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 8,
    backgroundColor: Colors.white,
    paddingHorizontal: 10,
    minHeight: 54,
  },
  inputIcon: {
    marginRight: 6,
  },
  textInput: {
    flex: 1,
    paddingVertical: 14,
    fontSize: 16,
    color: Colors.text,
  },
  searchButton: {
    backgroundColor: Colors.primary,
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 15,
  },
  searchButtonDisabled: {
    backgroundColor: Colors.gray300,
  },
  searchButtonText: {
    color: Colors.white,
    fontSize: 14,
    fontWeight: '700',
  },
});
