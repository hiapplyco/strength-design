/**
 * SearchResults - Display exercise search results with cards
 *
 * Renders a list of exercises with relevant details in card format
 */

import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../contexts/ThemeContext';

// Highlight search terms in text
function HighlightedText({ text, highlightTerms, style, highlightStyle }) {
  if (!highlightTerms || highlightTerms.length === 0) {
    return <Text style={style}>{text}</Text>;
  }

  const parts = [];
  let currentIndex = 0;
  const lowerText = text.toLowerCase();

  // Find all matches
  const matches = [];
  highlightTerms.forEach(term => {
    const lowerTerm = term.toLowerCase();
    let index = lowerText.indexOf(lowerTerm);
    while (index !== -1) {
      matches.push({ start: index, end: index + term.length });
      index = lowerText.indexOf(lowerTerm, index + 1);
    }
  });

  // Sort matches by start position
  matches.sort((a, b) => a.start - b.start);

  // Build parts array
  matches.forEach(match => {
    if (match.start > currentIndex) {
      parts.push({
        text: text.substring(currentIndex, match.start),
        highlight: false,
      });
    }
    parts.push({
      text: text.substring(match.start, match.end),
      highlight: true,
    });
    currentIndex = match.end;
  });

  if (currentIndex < text.length) {
    parts.push({
      text: text.substring(currentIndex),
      highlight: false,
    });
  }

  if (parts.length === 0) {
    return <Text style={style}>{text}</Text>;
  }

  return (
    <Text style={style}>
      {parts.map((part, index) => (
        <Text key={index} style={part.highlight ? highlightStyle : {}}>
          {part.text}
        </Text>
      ))}
    </Text>
  );
}

// Exercise Card Component
function ExerciseCard({ exercise, highlightTerms, onPress, colors }) {
  return (
    <TouchableOpacity
      style={[
        styles.card,
        {
          backgroundColor: colors.surface,
          borderColor: colors.border,
        },
      ]}
      onPress={() => onPress(exercise)}
      activeOpacity={0.7}
    >
      {/* Header */}
      <View style={styles.cardHeader}>
        <View style={styles.cardTitleContainer}>
          <HighlightedText
            text={exercise.name || 'Unnamed Exercise'}
            highlightTerms={highlightTerms}
            style={[styles.cardTitle, { color: colors.text }]}
            highlightStyle={[styles.highlighted, { color: colors.primary }]}
          />
        </View>
        <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
      </View>

      {/* Details */}
      <View style={styles.cardDetails}>
        {exercise.category && (
          <View style={[styles.badge, { backgroundColor: colors.primary + '20' }]}>
            <Ionicons name="fitness-outline" size={12} color={colors.primary} />
            <Text style={[styles.badgeText, { color: colors.primary }]}>
              {exercise.category}
            </Text>
          </View>
        )}

        {exercise.equipment && (
          <View style={[styles.badge, { backgroundColor: colors.secondary + '20' }]}>
            <Ionicons name="barbell-outline" size={12} color={colors.secondary} />
            <Text style={[styles.badgeText, { color: colors.secondary }]}>
              {exercise.equipment}
            </Text>
          </View>
        )}

        {exercise.muscleGroups && exercise.muscleGroups.length > 0 && (
          <View style={[styles.badge, { backgroundColor: colors.info + '20' }]}>
            <Ionicons name="body-outline" size={12} color={colors.info} />
            <Text style={[styles.badgeText, { color: colors.info }]}>
              {exercise.muscleGroups.slice(0, 2).join(', ')}
              {exercise.muscleGroups.length > 2 && ` +${exercise.muscleGroups.length - 2}`}
            </Text>
          </View>
        )}
      </View>

      {/* Description preview if available */}
      {exercise.description && (
        <Text
          style={[styles.cardDescription, { color: colors.textSecondary }]}
          numberOfLines={2}
        >
          {exercise.description}
        </Text>
      )}
    </TouchableOpacity>
  );
}

export default function SearchResults({
  exercises = [],
  isLoading = false,
  error = null,
  highlightTerms = [],
  onExercisePress,
  searchSummary = '',
}) {
  const { colors } = useTheme();

  // Loading state
  if (isLoading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={[styles.centerText, { color: colors.textSecondary }]}>
          Searching exercises...
        </Text>
      </View>
    );
  }

  // Error state
  if (error) {
    return (
      <View style={styles.centerContainer}>
        <Ionicons name="alert-circle-outline" size={48} color={colors.error} />
        <Text style={[styles.centerText, { color: colors.text }]}>
          Error loading exercises
        </Text>
        <Text style={[styles.errorText, { color: colors.textSecondary }]}>
          {error}
        </Text>
      </View>
    );
  }

  // Empty state
  if (exercises.length === 0) {
    return (
      <View style={styles.centerContainer}>
        <Ionicons name="search-outline" size={48} color={colors.textSecondary} />
        <Text style={[styles.centerText, { color: colors.text }]}>
          No exercises found
        </Text>
        <Text style={[styles.emptySubtext, { color: colors.textSecondary }]}>
          Try adjusting your search or filters
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Search Summary */}
      {searchSummary && (
        <View style={styles.summaryContainer}>
          <Text style={[styles.summaryText, { color: colors.textSecondary }]}>
            {searchSummary}
          </Text>
        </View>
      )}

      {/* Results List */}
      <FlatList
        data={exercises}
        keyExtractor={(item, index) => item.id || `exercise-${index}`}
        renderItem={({ item }) => (
          <ExerciseCard
            exercise={item}
            highlightTerms={highlightTerms}
            onPress={onExercisePress}
            colors={colors}
          />
        )}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        initialNumToRender={10}
        maxToRenderPerBatch={10}
        windowSize={5}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  summaryContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  summaryText: {
    fontSize: 14,
    fontWeight: '500',
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  card: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 16,
    marginBottom: 12,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  cardTitleContainer: {
    flex: 1,
    marginRight: 8,
  },
  cardTitle: {
    fontSize: 17,
    fontWeight: '600',
    lineHeight: 22,
  },
  highlighted: {
    fontWeight: '700',
  },
  cardDetails: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 8,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '500',
  },
  cardDescription: {
    fontSize: 14,
    lineHeight: 20,
    marginTop: 4,
  },
  centerContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
    paddingVertical: 64,
  },
  centerText: {
    fontSize: 18,
    fontWeight: '600',
    marginTop: 16,
    marginBottom: 8,
    textAlign: 'center',
  },
  errorText: {
    fontSize: 14,
    textAlign: 'center',
  },
  emptySubtext: {
    fontSize: 14,
    textAlign: 'center',
  },
});
