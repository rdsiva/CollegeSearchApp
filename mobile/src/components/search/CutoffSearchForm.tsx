import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
} from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { CATEGORIES, COURSES, YEARS, DEFAULT_CATEGORY, DEFAULT_YEAR } from '@/constants/search';
import type { Category } from '@/constants/search';
import { Colors } from '@/constants/colors';
import type { SearchParams } from '@/types';

interface CutoffSearchFormProps {
  onSearch: (params: SearchParams) => void;
}

const COURSE_OPTIONS = COURSES.filter((c) => c.value !== '');

export default function CutoffSearchForm({ onSearch }: CutoffSearchFormProps) {
  const [markText, setMarkText] = useState<string>('');
  const [category, setCategory] = useState<Category>(DEFAULT_CATEGORY);
  const [selectedCourses, setSelectedCourses] = useState<Set<string>>(new Set());
  const [year, setYear] = useState<string>(DEFAULT_YEAR);
  const [validationError, setValidationError] = useState<string | null>(null);

  const toggleCourse = (value: string) => {
    setSelectedCourses((prev) => {
      const next = new Set(prev);
      if (next.has(value)) next.delete(value);
      else next.add(value);
      return next;
    });
  };

  const handleSearch = () => {
    const trimmed = markText.trim();
    // L3: strict numeric validation — reject inputs like "185abc" that parseFloat would accept
    if (trimmed === '' || !/^\d{1,3}(\.\d{1,2})?$/.test(trimmed)) {
      setValidationError('Please enter a valid cutoff mark (e.g. 185.5).');
      return;
    }
    const parsed = parseFloat(trimmed);
    if (parsed < 0 || parsed > 200) {
      setValidationError('Mark must be between 0 and 200.');
      return;
    }
    setValidationError(null);
    onSearch({
      type: 'cutoff',
      mark: parsed,
      category,
      courses: selectedCourses.size > 0 ? Array.from(selectedCourses) : undefined,
      year,
    });
  };

  return (
    <View style={styles.container}>
      <Text style={styles.label}>Your Cutoff Mark</Text>
      <TextInput
        style={[styles.input, validationError ? styles.inputError : null]}
        value={markText}
        onChangeText={(t) => {
          setMarkText(t);
          if (validationError) setValidationError(null);
        }}
        keyboardType="decimal-pad"
        placeholder="e.g. 185.5"
        placeholderTextColor={Colors.textMuted}
        maxLength={6}
        accessibilityLabel="Cutoff mark input"
      />
      {validationError ? (
        <Text style={styles.errorText}>{validationError}</Text>
      ) : null}

      <Text style={styles.label}>Category</Text>
      <View style={styles.pickerWrapper}>
        <Picker<Category>
          selectedValue={category}
          onValueChange={(val) => setCategory(val)}
          style={styles.picker}
          dropdownIconColor={Colors.gray600}
          accessibilityLabel="Category picker"
        >
          {CATEGORIES.map((cat) => (
            <Picker.Item key={cat} label={cat} value={cat} />
          ))}
        </Picker>
      </View>

      <Text style={styles.label}>Courses</Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.chipsRow}
        style={styles.chipsScroll}
      >
        <TouchableOpacity
          style={[styles.chip, selectedCourses.size === 0 && styles.chipSelected]}
          onPress={() => setSelectedCourses(new Set())}
          accessibilityLabel="Select all courses"
        >
          <Text style={[styles.chipText, selectedCourses.size === 0 && styles.chipTextSelected]}>
            All Courses
          </Text>
        </TouchableOpacity>
        {COURSE_OPTIONS.map((c) => {
          const isSelected = selectedCourses.has(c.value);
          return (
            <TouchableOpacity
              key={c.value}
              style={[styles.chip, isSelected && styles.chipSelected]}
              onPress={() => toggleCourse(c.value)}
              accessibilityLabel={`Toggle ${c.label}`}
            >
              <Text style={[styles.chipText, isSelected && styles.chipTextSelected]}>
                {c.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
      {selectedCourses.size > 0 && (
        <Text style={styles.selectionHint}>
          {selectedCourses.size} course{selectedCourses.size > 1 ? 's' : ''} selected
        </Text>
      )}

      <Text style={styles.label}>Year</Text>
      <View style={styles.pickerWrapper}>
        <Picker<string>
          selectedValue={year}
          onValueChange={(val) => setYear(val)}
          style={styles.picker}
          dropdownIconColor={Colors.gray600}
          accessibilityLabel="Year picker"
        >
          {YEARS.map((y) => (
            <Picker.Item key={y.value} label={y.label} value={y.value} />
          ))}
        </Picker>
      </View>

      <TouchableOpacity
        style={styles.searchButton}
        onPress={handleSearch}
        accessibilityLabel="Search by cutoff"
        hitSlop={{ top: 4, bottom: 4, left: 4, right: 4 }}
      >
        <Text style={styles.searchButtonText}>Search by Cutoff</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingTop: 8,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.gray700,
    marginBottom: 4,
    marginTop: 12,
  },
  input: {
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 14,
    fontSize: 16,
    color: Colors.text,
    backgroundColor: Colors.white,
    minHeight: 54,
  },
  inputError: {
    borderColor: Colors.danger,
  },
  errorText: {
    fontSize: 12,
    color: Colors.danger,
    marginTop: 4,
  },
  pickerWrapper: {
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 8,
    backgroundColor: Colors.white,
    overflow: 'hidden',
    minHeight: 54,
    justifyContent: 'center',
  },
  picker: {
    color: Colors.text,
    height: 54,
    fontSize: 16,
  },
  chipsScroll: {
    flexGrow: 0,
  },
  chipsRow: {
    flexDirection: 'row',
    gap: 8,
    paddingVertical: 4,
  },
  chip: {
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: Colors.white,
  },
  chipSelected: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primaryLight,
  },
  chipText: {
    fontSize: 12,
    color: Colors.gray700,
    fontWeight: '500',
  },
  chipTextSelected: {
    color: Colors.primary,
    fontWeight: '700',
  },
  selectionHint: {
    fontSize: 11,
    color: Colors.primary,
    marginTop: 4,
  },
  searchButton: {
    marginTop: 20,
    backgroundColor: Colors.primary,
    borderRadius: 8,
    paddingVertical: 13,
    alignItems: 'center',
  },
  searchButtonText: {
    color: Colors.white,
    fontSize: 15,
    fontWeight: '700',
  },
});
