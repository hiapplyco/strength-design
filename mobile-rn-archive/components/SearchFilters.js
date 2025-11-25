/**
 * SearchFilters - Filter exercises by category, equipment, and sort options
 *
 * Provides filter chips and controls for refining exercise search results
 */

import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../contexts/ThemeContext';

// Common exercise categories
const CATEGORIES = [
  'Strength',
  'Cardio',
  'Flexibility',
  'Balance',
  'Plyometrics',
  'Powerlifting',
  'Olympic Weightlifting',
];

// Common equipment types
const EQUIPMENT = [
  'Barbell',
  'Dumbbell',
  'Kettlebell',
  'Machine',
  'Cable',
  'Bodyweight',
  'Bands',
  'None',
];

// Sort options
const SORT_OPTIONS = [
  { value: 'relevance', label: 'Relevance', icon: 'star-outline' },
  { value: 'alphabetical', label: 'A-Z', icon: 'text-outline' },
  { value: 'category', label: 'Category', icon: 'list-outline' },
];

export default function SearchFilters({
  selectedCategory,
  selectedEquipment,
  sortOption = 'relevance',
  onCategorySelect,
  onEquipmentSelect,
  onSortChange,
  onClearFilters,
  hasActiveFilters = false,
}) {
  const { colors } = useTheme();

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Filter Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Ionicons name="options-outline" size={20} color={colors.text} />
          <Text style={[styles.headerTitle, { color: colors.text }]}>
            Filters
          </Text>
        </View>
        {hasActiveFilters && (
          <TouchableOpacity
            onPress={onClearFilters}
            style={styles.clearAllButton}
          >
            <Text style={[styles.clearAllText, { color: colors.primary }]}>
              Clear All
            </Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Category Filter */}
      <View style={styles.filterSection}>
        <Text style={[styles.filterLabel, { color: colors.textSecondary }]}>
          Category
        </Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.chipContainer}
        >
          {CATEGORIES.map((category) => {
            const isSelected = selectedCategory === category;
            return (
              <TouchableOpacity
                key={category}
                style={[
                  styles.chip,
                  {
                    backgroundColor: isSelected ? colors.primary : colors.surface,
                    borderColor: isSelected ? colors.primary : colors.border,
                  },
                ]}
                onPress={() => onCategorySelect(isSelected ? null : category)}
              >
                <Text
                  style={[
                    styles.chipText,
                    { color: isSelected ? '#FFFFFF' : colors.text },
                  ]}
                >
                  {category}
                </Text>
                {isSelected && (
                  <Ionicons name="close-circle" size={16} color="#FFFFFF" />
                )}
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* Equipment Filter */}
      <View style={styles.filterSection}>
        <Text style={[styles.filterLabel, { color: colors.textSecondary }]}>
          Equipment
        </Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.chipContainer}
        >
          {EQUIPMENT.map((equipment) => {
            const isSelected = selectedEquipment === equipment;
            return (
              <TouchableOpacity
                key={equipment}
                style={[
                  styles.chip,
                  {
                    backgroundColor: isSelected ? colors.secondary : colors.surface,
                    borderColor: isSelected ? colors.secondary : colors.border,
                  },
                ]}
                onPress={() => onEquipmentSelect(isSelected ? null : equipment)}
              >
                <Text
                  style={[
                    styles.chipText,
                    { color: isSelected ? '#FFFFFF' : colors.text },
                  ]}
                >
                  {equipment}
                </Text>
                {isSelected && (
                  <Ionicons name="close-circle" size={16} color="#FFFFFF" />
                )}
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* Sort Options */}
      <View style={styles.filterSection}>
        <Text style={[styles.filterLabel, { color: colors.textSecondary }]}>
          Sort By
        </Text>
        <View style={styles.sortContainer}>
          {SORT_OPTIONS.map((option) => {
            const isSelected = sortOption === option.value;
            return (
              <TouchableOpacity
                key={option.value}
                style={[
                  styles.sortButton,
                  {
                    backgroundColor: isSelected ? colors.surface : 'transparent',
                    borderColor: colors.border,
                  },
                ]}
                onPress={() => onSortChange(option.value)}
              >
                <Ionicons
                  name={option.icon}
                  size={18}
                  color={isSelected ? colors.primary : colors.textSecondary}
                />
                <Text
                  style={[
                    styles.sortButtonText,
                    { color: isSelected ? colors.primary : colors.text },
                  ]}
                >
                  {option.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingVertical: 12,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  clearAllButton: {
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  clearAllText: {
    fontSize: 14,
    fontWeight: '600',
  },
  filterSection: {
    marginBottom: 16,
  },
  filterLabel: {
    fontSize: 13,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    paddingHorizontal: 16,
    marginBottom: 8,
  },
  chipContainer: {
    paddingHorizontal: 16,
    gap: 8,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    gap: 6,
  },
  chipText: {
    fontSize: 14,
    fontWeight: '500',
  },
  sortContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    gap: 8,
  },
  sortButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    gap: 6,
  },
  sortButtonText: {
    fontSize: 14,
    fontWeight: '500',
  },
});
