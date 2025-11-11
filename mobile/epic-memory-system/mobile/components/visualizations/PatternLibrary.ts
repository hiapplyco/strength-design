import { PatternDefinition } from './VisualizationTypes';

/**
 * Pattern Library for Strength.Design Visualizations
 * Contains pixel matrix patterns for various animations
 */

// Strength.Design Logo Patterns
export const STRENGTH_DESIGN_PATTERNS = {
  // S.D. Logo - Standard version
  SD_LOGO: {
    name: 'SD_LOGO',
    matrix: [
      // S pattern (left side)
      [1,1,1,1,0,0,0,0,0,1,1,1,1],
      [1,0,0,0,0,0,0,0,0,1,0,0,0],
      [1,1,1,0,0,0,0,0,0,1,0,0,0],
      [0,0,1,0,0,1,0,0,0,1,0,0,0],
      [1,1,1,0,0,0,0,0,0,1,0,0,0],
      [0,0,0,0,0,0,0,0,0,1,0,0,0],
      [1,1,1,1,0,0,0,0,0,1,1,1,1]
    ],
    width: 13,
    height: 7,
    center: { x: 6, y: 3 }
  } as PatternDefinition,

  // Minimalist S.D.
  SD_MINIMAL: {
    name: 'SD_MINIMAL',
    matrix: [
      [1,1,1,0,0,1,1,1],
      [1,0,0,0,0,1,0,0],
      [1,1,0,0,0,1,1,1],
      [0,1,0,1,0,1,0,0],
      [1,1,0,0,0,1,1,1]
    ],
    width: 8,
    height: 5,
    center: { x: 4, y: 2 }
  } as PatternDefinition,

  // Burst variant with radiating elements
  SD_BURST: {
    name: 'SD_BURST',
    matrix: [
      [0,0,1,0,0,0,0,0,1,0,0],
      [0,1,1,1,0,1,0,1,1,1,0],
      [1,1,1,1,0,0,0,1,1,1,1],
      [0,1,1,1,0,1,0,1,1,1,0],
      [0,0,1,0,0,0,0,0,1,0,0]
    ],
    width: 11,
    height: 5,
    center: { x: 5, y: 2 }
  } as PatternDefinition
};

// Fitness Equipment Patterns
export const FITNESS_PATTERNS = {
  // Enhanced Barbell Pattern
  BARBELL: {
    name: 'BARBELL',
    matrix: [
      [1,1,1,0,0,0,0,0,0,0,0,0,0,1,1,1],
      [1,1,1,0,0,0,0,0,0,0,0,0,0,1,1,1],
      [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
      [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
      [1,1,1,0,0,0,0,0,0,0,0,0,0,1,1,1],
      [1,1,1,0,0,0,0,0,0,0,0,0,0,1,1,1]
    ],
    width: 16,
    height: 6,
    center: { x: 8, y: 3 }
  } as PatternDefinition,

  // Dumbbell (enhanced from original)
  DUMBBELL_ENHANCED: {
    name: 'DUMBBELL_ENHANCED',
    matrix: [
      [1,1,1,0,0,0,0,0,0,1,1,1],
      [1,1,1,0,0,0,0,0,0,1,1,1],
      [1,1,1,1,1,1,1,1,1,1,1,1],
      [0,1,1,1,1,1,1,1,1,1,1,0],
      [1,1,1,1,1,1,1,1,1,1,1,1],
      [1,1,1,0,0,0,0,0,0,1,1,1],
      [1,1,1,0,0,0,0,0,0,1,1,1]
    ],
    width: 12,
    height: 7,
    center: { x: 6, y: 3 }
  } as PatternDefinition,

  // Kettlebell Pattern
  KETTLEBELL: {
    name: 'KETTLEBELL',
    matrix: [
      [0,0,1,1,1,1,1,0,0],
      [0,1,1,1,1,1,1,1,0],
      [1,1,1,1,1,1,1,1,1],
      [1,1,1,1,1,1,1,1,1],
      [1,1,1,1,1,1,1,1,1],
      [0,1,1,1,1,1,1,1,0],
      [0,0,1,1,1,1,1,0,0],
      [0,0,0,0,1,0,0,0,0]
    ],
    width: 9,
    height: 8,
    center: { x: 4, y: 4 }
  } as PatternDefinition
};

// Biological Patterns
export const BIOLOGICAL_PATTERNS = {
  // Muscle Fiber Pattern
  MUSCLE_FIBER: {
    name: 'MUSCLE_FIBER',
    matrix: [
      [1,0,1,0,1,0,1,0,1,0,1],
      [0,1,0,1,0,1,0,1,0,1,0],
      [1,0,1,0,1,0,1,0,1,0,1],
      [0,1,0,1,0,1,0,1,0,1,0],
      [1,0,1,0,1,0,1,0,1,0,1],
      [0,1,0,1,0,1,0,1,0,1,0],
      [1,0,1,0,1,0,1,0,1,0,1]
    ],
    width: 11,
    height: 7,
    center: { x: 5, y: 3 }
  } as PatternDefinition,

  // DNA Double Helix Cross-section
  DNA_HELIX: {
    name: 'DNA_HELIX',
    matrix: [
      [1,0,0,0,0,0,0,0,1],
      [0,1,0,0,0,0,0,1,0],
      [0,0,1,0,0,0,1,0,0],
      [0,0,0,1,1,1,0,0,0],
      [0,0,1,0,0,0,1,0,0],
      [0,1,0,0,0,0,0,1,0],
      [1,0,0,0,0,0,0,0,1]
    ],
    width: 9,
    height: 7,
    center: { x: 4, y: 3 }
  } as PatternDefinition,

  // Heart Rate Monitor
  HEARTBEAT_LINE: {
    name: 'HEARTBEAT_LINE',
    matrix: [
      [0,0,0,0,0,0,1,0,0,0,0,0,0],
      [0,0,0,0,0,1,1,1,0,0,0,0,0],
      [1,1,1,1,1,1,0,1,1,1,1,1,1],
      [0,0,0,0,0,0,0,0,0,0,0,0,0],
      [0,0,0,0,0,0,0,0,0,0,0,0,0]
    ],
    width: 13,
    height: 5,
    center: { x: 6, y: 2 }
  } as PatternDefinition
};

// Energy and Power Patterns
export const ENERGY_PATTERNS = {
  // Lightning Bolt (enhanced)
  LIGHTNING_ENHANCED: {
    name: 'LIGHTNING_ENHANCED',
    matrix: [
      [0,0,1,1,1,0,0],
      [0,1,1,0,0,0,0],
      [1,1,1,1,0,0,0],
      [1,0,1,1,1,0,0],
      [0,0,0,1,1,1,0],
      [0,0,0,0,1,1,1],
      [0,0,0,0,0,1,1]
    ],
    width: 7,
    height: 7,
    center: { x: 3, y: 3 }
  } as PatternDefinition,

  // Energy Burst Pattern
  ENERGY_BURST: {
    name: 'ENERGY_BURST',
    matrix: [
      [0,0,1,0,0,1,0,0],
      [1,0,0,1,1,0,0,1],
      [0,1,0,1,1,0,1,0],
      [0,0,1,1,1,1,0,0],
      [0,1,0,1,1,0,1,0],
      [1,0,0,1,1,0,0,1],
      [0,0,1,0,0,1,0,0]
    ],
    width: 8,
    height: 7,
    center: { x: 4, y: 3 }
  } as PatternDefinition,

  // Atomic Structure
  ATOMIC: {
    name: 'ATOMIC',
    matrix: [
      [0,0,1,0,1,0,1,0,0],
      [0,1,0,0,1,0,0,1,0],
      [1,0,0,0,1,0,0,0,1],
      [0,0,0,1,1,1,0,0,0],
      [1,1,1,1,1,1,1,1,1],
      [0,0,0,1,1,1,0,0,0],
      [1,0,0,0,1,0,0,0,1],
      [0,1,0,0,1,0,0,1,0],
      [0,0,1,0,1,0,1,0,0]
    ],
    width: 9,
    height: 9,
    center: { x: 4, y: 4 }
  } as PatternDefinition
};

// Achievement and Success Patterns
export const ACHIEVEMENT_PATTERNS = {
  // Trophy (enhanced)
  TROPHY_ENHANCED: {
    name: 'TROPHY_ENHANCED',
    matrix: [
      [0,1,1,1,1,1,1,1,0],
      [1,1,1,1,1,1,1,1,1],
      [1,1,1,1,1,1,1,1,1],
      [0,1,1,1,1,1,1,1,0],
      [0,0,1,1,1,1,1,0,0],
      [0,0,1,1,1,1,1,0,0],
      [0,1,1,1,1,1,1,1,0],
      [1,1,1,1,1,1,1,1,1]
    ],
    width: 9,
    height: 8,
    center: { x: 4, y: 4 }
  } as PatternDefinition,

  // Star Pattern
  STAR: {
    name: 'STAR',
    matrix: [
      [0,0,0,1,0,0,0],
      [0,0,1,1,1,0,0],
      [0,1,1,1,1,1,0],
      [1,1,1,1,1,1,1],
      [0,1,1,1,1,1,0],
      [0,1,0,1,0,1,0],
      [1,0,0,1,0,0,1]
    ],
    width: 7,
    height: 7,
    center: { x: 3, y: 3 }
  } as PatternDefinition,

  // Medal Pattern
  MEDAL: {
    name: 'MEDAL',
    matrix: [
      [1,0,0,1,1,1,0,0,1],
      [0,1,0,1,1,1,0,1,0],
      [0,0,1,1,1,1,1,0,0],
      [0,1,1,1,1,1,1,1,0],
      [1,1,1,1,1,1,1,1,1],
      [1,1,1,1,1,1,1,1,1],
      [0,1,1,1,1,1,1,1,0],
      [0,0,1,1,1,1,1,0,0]
    ],
    width: 9,
    height: 8,
    center: { x: 4, y: 4 }
  } as PatternDefinition
};

// Combined pattern library
export const PATTERN_LIBRARY = {
  ...STRENGTH_DESIGN_PATTERNS,
  ...FITNESS_PATTERNS,
  ...BIOLOGICAL_PATTERNS,
  ...ENERGY_PATTERNS,
  ...ACHIEVEMENT_PATTERNS
};

// Utility functions
export const getPatternByName = (name: string): PatternDefinition | null => {
  return PATTERN_LIBRARY[name as keyof typeof PATTERN_LIBRARY] || null;
};

export const getRandomPattern = (category?: 'fitness' | 'biological' | 'energy' | 'achievement'): PatternDefinition => {
  let patterns: PatternDefinition[];
  
  switch (category) {
    case 'fitness':
      patterns = Object.values(FITNESS_PATTERNS);
      break;
    case 'biological':
      patterns = Object.values(BIOLOGICAL_PATTERNS);
      break;
    case 'energy':
      patterns = Object.values(ENERGY_PATTERNS);
      break;
    case 'achievement':
      patterns = Object.values(ACHIEVEMENT_PATTERNS);
      break;
    default:
      patterns = Object.values(PATTERN_LIBRARY);
  }
  
  return patterns[Math.floor(Math.random() * patterns.length)];
};

export const scalePattern = (pattern: PatternDefinition, scale: number): PatternDefinition => {
  if (scale === 1) return pattern;
  
  const scaledMatrix: number[][] = [];
  const newHeight = Math.floor(pattern.height * scale);
  const newWidth = Math.floor(pattern.width * scale);
  
  for (let y = 0; y < newHeight; y++) {
    const row: number[] = [];
    for (let x = 0; x < newWidth; x++) {
      const originalY = Math.floor(y / scale);
      const originalX = Math.floor(x / scale);
      
      if (originalY < pattern.matrix.length && originalX < pattern.matrix[0].length) {
        row.push(pattern.matrix[originalY][originalX]);
      } else {
        row.push(0);
      }
    }
    scaledMatrix.push(row);
  }
  
  return {
    ...pattern,
    name: `${pattern.name}_SCALED_${scale}`,
    matrix: scaledMatrix,
    width: newWidth,
    height: newHeight,
    center: {
      x: Math.floor(pattern.center.x * scale),
      y: Math.floor(pattern.center.y * scale)
    }
  };
};
