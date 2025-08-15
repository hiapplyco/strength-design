import React, { memo, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Modal,
  Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { searchService } from '../services/searchService';

/**
 * SearchFilters Component
 * 
 * Features:
 * - Multi-select filters
 * - Filter presets (Home, Gym, etc.)
 * - Visual filter chips
 * - Clear all functionality
 * - Custom filter combinations
 * - Smooth animations
 */
const SearchFilters = memo(({
  activeFilters = {},
  onFiltersChange,
  onClearAll,
  isVisible = false,
  onToggleVisibility
}) => {
  const [expandedSection, setExpandedSection] = useState(null);
  const [showPresets, setShowPresets] = useState(false);
  
  // Filter options
  const filterOptions = {
    categories: [
      'strength', 'cardio', 'stretching', 'plyometrics', 
      'powerlifting', 'olympic', 'strongman', 'calisthenics'
    ],
    equipment: [
      'barbell', 'dumbbell', 'bodyweight', 'machine', 'cable',
      'kettlebell', 'resistance_band', 'medicine_ball', 'none'
    ],
    muscles: [
      'chest', 'back', 'shoulders', 'biceps', 'triceps', 'forearms',
      'abs', 'quadriceps', 'hamstrings', 'glutes', 'calves'
    ],
    difficulty: ['beginner', 'intermediate', 'advanced']
  };
  
  // Filter presets
  const presets = searchService.getAllFilterPresets();
  
  const getActiveFilterCount = () => {
    return Object.values(activeFilters).reduce((count, filter) => {
      return count + (Array.isArray(filter) ? filter.length : (filter ? 1 : 0));
    }, 0);
  };
  
  const handleFilterToggle = (filterType, value) => {
    const currentValues = activeFilters[filterType] || [];
    const isActive = currentValues.includes(value);
    
    let newValues;
    if (isActive) {
      newValues = currentValues.filter(v => v !== value);
    } else {
      newValues = [...currentValues, value];
    }
    
    onFiltersChange({
      ...activeFilters,
      [filterType]: newValues
    });
  };
  
  const handlePresetSelect = (preset) => {
    onFiltersChange(preset.filters);
    setShowPresets(false);
  };
  
  const renderFilterChip = (filterType, value) => {
    const isActive = (activeFilters[filterType] || []).includes(value);
    
    return (
      <TouchableOpacity
        key={value}
        style={[
          styles.filterChip,
          isActive && styles.filterChipActive
        ]}
        onPress={() => handleFilterToggle(filterType, value)}
        activeOpacity={0.7}
      >
        <Text style={[
          styles.filterChipText,
          isActive && styles.filterChipTextActive
        ]}>
          {value.charAt(0).toUpperCase() + value.slice(1).replace('_', ' ')}
        </Text>
        {isActive && (
          <Ionicons 
            name="checkmark-circle" 
            size={16} 
            color="white" 
            style={styles.chipCheckmark}
          />
        )}
      </TouchableOpacity>
    );
  };
  
  const renderFilterSection = (title, filterType, icon) => {
    const isExpanded = expandedSection === filterType;
    const activeCount = (activeFilters[filterType] || []).length;
    
    return (
      <View style={styles.filterSection}>
        <TouchableOpacity
          style={styles.sectionHeader}
          onPress={() => setExpandedSection(isExpanded ? null : filterType)}
          activeOpacity={0.7}
        >
          <View style={styles.sectionTitleContainer}>
            <Ionicons name={icon} size={18} color="#FF6B35" />
            <Text style={styles.sectionTitle}>{title}</Text>
            {activeCount > 0 && (
              <View style={styles.activeCountBadge}>
                <Text style={styles.activeCountText}>{activeCount}</Text>
              </View>
            )}
          </View>
          <Ionicons 
            name={isExpanded ? "chevron-up" : "chevron-down"} 
            size={20} 
            color="#666" 
          />
        </TouchableOpacity>
        
        {isExpanded && (
          <View style={styles.sectionContent}>
            <View style={styles.filterChipsContainer}>
              {filterOptions[filterType].map(value => 
                renderFilterChip(filterType, value)
              )}
            </View>
          </View>
        )}
      </View>
    );
  };
  
  const renderActiveFiltersBar = () => {
    const activeCount = getActiveFilterCount();
    
    if (activeCount === 0) return null;
    
    const activeChips = [];
    
    Object.entries(activeFilters).forEach(([filterType, values]) => {
      if (Array.isArray(values)) {
        values.forEach(value => {
          activeChips.push({
            type: filterType,
            value,
            display: `${value.charAt(0).toUpperCase() + value.slice(1).replace('_', ' ')}`
          });
        });
      }
    });
    
    return (
      <View style={styles.activeFiltersBar}>
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          style={styles.activeFiltersScroll}
        >
          {activeChips.map(({ type, value, display }, index) => (
            <TouchableOpacity
              key={`${type}-${value}`}
              style={styles.activeFilterChip}
              onPress={() => handleFilterToggle(type, value)}
            >
              <Text style={styles.activeFilterText}>{display}</Text>
              <Ionicons name="close" size={14} color="white" />
            </TouchableOpacity>
          ))}
        </ScrollView>
        
        <TouchableOpacity 
          style={styles.clearAllButton}
          onPress={onClearAll}
        >
          <Text style={styles.clearAllText}>Clear All</Text>
        </TouchableOpacity>
      </View>
    );
  };
  
  return (
    <>
      {/* Active Filters Bar - Always visible when filters are active */}
      {renderActiveFiltersBar()}
      
      {/* Filter Toggle Button */}
      <View style={styles.filterControls}>
        <TouchableOpacity
          style={[
            styles.filterToggleButton,
            isVisible && styles.filterToggleButtonActive
          ]}
          onPress={onToggleVisibility}
          activeOpacity={0.7}
        >
          <Ionicons 
            name="filter" 
            size={18} 
            color={isVisible ? "white" : "#666"} 
          />
          <Text style={[
            styles.filterToggleText,
            isVisible && styles.filterToggleTextActive
          ]}>
            Filters
          </Text>
          {getActiveFilterCount() > 0 && (
            <View style={styles.filterCountBadge}>
              <Text style={styles.filterCountText}>{getActiveFilterCount()}</Text>
            </View>
          )}
        </TouchableOpacity>
        
        <TouchableOpacity
          style={styles.presetsButton}
          onPress={() => setShowPresets(true)}
          activeOpacity={0.7}
        >
          <Ionicons name="bookmark-outline" size={18} color="#FF6B35" />
          <Text style={styles.presetsButtonText}>Presets</Text>
        </TouchableOpacity>
      </View>
      
      {/* Expandable Filter Sections */}
      {isVisible && (
        <View style={styles.filterContainer}>
          {renderFilterSection('Category', 'categories', 'grid-outline')}
          {renderFilterSection('Equipment', 'equipment', 'barbell-outline')}
          {renderFilterSection('Muscles', 'muscles', 'body-outline')}
          {renderFilterSection('Difficulty', 'difficulty', 'stats-chart-outline')}
          
          {/* Saved Exercises Toggle */}
          <View style={styles.filterSection}>
            <TouchableOpacity
              style={styles.savedToggle}
              onPress={() => onFiltersChange({
                ...activeFilters,
                saved: !activeFilters.saved
              })}
              activeOpacity={0.7}
            >
              <View style={styles.sectionTitleContainer}>
                <Ionicons name="heart" size={18} color="#FF6B35" />
                <Text style={styles.sectionTitle}>Saved Only</Text>
              </View>
              <View style={[
                styles.toggle,
                activeFilters.saved && styles.toggleActive
              ]}>
                <Animated.View style={[
                  styles.toggleThumb,
                  activeFilters.saved && styles.toggleThumbActive
                ]} />
              </View>
            </TouchableOpacity>
          </View>
        </View>
      )}
      
      {/* Presets Modal */}
      <Modal
        visible={showPresets}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowPresets(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.presetsModal}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Filter Presets</Text>
              <TouchableOpacity 
                onPress={() => setShowPresets(false)}
                style={styles.modalCloseButton}
              >
                <Ionicons name="close" size={24} color="#666" />
              </TouchableOpacity>
            </View>
            
            <ScrollView style={styles.presetsScrollView}>
              {presets.map(preset => (
                <TouchableOpacity
                  key={preset.id}
                  style={styles.presetItem}
                  onPress={() => handlePresetSelect(preset)}
                  activeOpacity={0.7}
                >
                  <View style={styles.presetContent}>
                    <Text style={styles.presetName}>{preset.name}</Text>
                    <Text style={styles.presetDescription}>{preset.description}</Text>
                  </View>
                  <Ionicons name="chevron-forward" size={20} color="#666" />
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </>
  );
});

const styles = StyleSheet.create({
  activeFiltersBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 8,
    backgroundColor: '#1a1a1a',
    borderBottomWidth: 1,
    borderBottomColor: '#2a2a2a',
  },
  activeFiltersScroll: {
    flex: 1,
    marginRight: 10,
  },
  activeFilterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FF6B35',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginRight: 8,
    gap: 6,
  },
  activeFilterText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '500',
  },
  clearAllButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  clearAllText: {
    color: '#FF6B35',
    fontSize: 12,
    fontWeight: '600',
  },
  filterControls: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 10,
    gap: 12,
  },
  filterToggleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1a1a1a',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#2a2a2a',
    gap: 8,
  },
  filterToggleButtonActive: {
    backgroundColor: '#FF6B35',
    borderColor: '#FF6B35',
  },
  filterToggleText: {
    color: '#666',
    fontSize: 14,
    fontWeight: '500',
  },
  filterToggleTextActive: {
    color: 'white',
  },
  filterCountBadge: {
    backgroundColor: 'white',
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 2,
    marginLeft: 4,
  },
  filterCountText: {
    color: '#FF6B35',
    fontSize: 10,
    fontWeight: 'bold',
  },
  presetsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1a1a1a',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#2a2a2a',
    gap: 8,
  },
  presetsButtonText: {
    color: '#FF6B35',
    fontSize: 14,
    fontWeight: '500',
  },
  filterContainer: {
    backgroundColor: '#1a1a1a',
    borderBottomWidth: 1,
    borderBottomColor: '#2a2a2a',
  },
  filterSection: {
    borderBottomWidth: 1,
    borderBottomColor: '#2a2a2a',
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  sectionTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  sectionTitle: {
    color: 'white',
    fontSize: 16,
    fontWeight: '500',
  },
  activeCountBadge: {
    backgroundColor: '#FF6B35',
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  activeCountText: {
    color: 'white',
    fontSize: 10,
    fontWeight: 'bold',
  },
  sectionContent: {
    paddingHorizontal: 20,
    paddingBottom: 12,
  },
  filterChipsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2a2a2a',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#3a3a3a',
    gap: 6,
  },
  filterChipActive: {
    backgroundColor: '#FF6B35',
    borderColor: '#FF6B35',
  },
  filterChipText: {
    color: '#999',
    fontSize: 12,
    fontWeight: '500',
  },
  filterChipTextActive: {
    color: 'white',
  },
  chipCheckmark: {
    marginLeft: 2,
  },
  savedToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  toggle: {
    width: 50,
    height: 30,
    backgroundColor: '#2a2a2a',
    borderRadius: 15,
    padding: 2,
    justifyContent: 'center',
  },
  toggleActive: {
    backgroundColor: '#FF6B35',
  },
  toggleThumb: {
    width: 26,
    height: 26,
    backgroundColor: 'white',
    borderRadius: 13,
    transform: [{ translateX: 0 }],
  },
  toggleThumbActive: {
    transform: [{ translateX: 20 }],
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'flex-end',
  },
  presetsModal: {
    backgroundColor: '#1a1a1a',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '70%',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#2a2a2a',
  },
  modalTitle: {
    color: 'white',
    fontSize: 18,
    fontWeight: '600',
  },
  modalCloseButton: {
    padding: 4,
  },
  presetsScrollView: {
    padding: 20,
  },
  presetItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#2a2a2a',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  presetContent: {
    flex: 1,
  },
  presetName: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  presetDescription: {
    color: '#999',
    fontSize: 14,
  },
});

SearchFilters.displayName = 'SearchFilters';

export default SearchFilters;