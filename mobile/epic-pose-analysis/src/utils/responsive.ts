
/**
 * Universal responsive utility classes and patterns
 */

// Consistent spacing tokens for mobile-first design
export const spacing = {
  // Mobile: tight spacing, Desktop: more generous
  container: "px-2 sm:px-4 lg:px-6",
  section: "py-2 sm:py-3 lg:py-4",
  card: "p-2 sm:p-4 lg:p-6",
  gap: "gap-2 sm:gap-3 lg:gap-4",
  
  // Special cases
  tight: "px-1 sm:px-2",
  loose: "px-4 sm:px-6 lg:px-8",
} as const;

// Responsive width patterns
export const width = {
  // Full viewport width, respecting sidebar
  full: "w-full max-w-none",
  
  // Content width with reasonable maximums
  content: "w-full max-w-4xl mx-auto",
  narrow: "w-full max-w-2xl mx-auto",
  wide: "w-full max-w-6xl mx-auto",
  
  // Prevent overflow
  contained: "w-full min-w-0 overflow-hidden",
} as const;

// Responsive grid patterns
export const grid = {
  // Mobile-first responsive grids
  cols2: "grid grid-cols-1 lg:grid-cols-2",
  cols3: "grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3",
  adaptive: "grid grid-cols-1 xl:grid-cols-2",
  
  // Flex alternatives for better mobile control
  flexStack: "flex flex-col xl:flex-row",
  flexWrap: "flex flex-wrap",
} as const;

// Layout utilities
export const layout = {
  // Prevent horizontal overflow
  noOverflow: "overflow-hidden min-w-0",
  
  // Flex child utilities
  flexChild: "min-w-0 flex-shrink-0",
  flexGrow: "min-w-0 flex-1",
  
  // Common layout patterns
  stack: "flex flex-col",
  center: "flex items-center justify-center",
  between: "flex items-center justify-between",
} as const;

// Text and interaction utilities
export const text = {
  // Responsive text sizing
  title: "text-lg sm:text-xl lg:text-2xl",
  subtitle: "text-sm sm:text-base",
  caption: "text-xs sm:text-sm",
  
  // Prevent text overflow
  truncate: "truncate min-w-0",
  ellipsis: "overflow-hidden text-ellipsis",
} as const;

// Touch-friendly sizing
export const touch = {
  // Minimum 44px touch targets
  button: "h-8 sm:h-9 lg:h-10",
  input: "h-9 sm:h-10",
  icon: "w-3 h-3 sm:w-4 sm:h-4",
  
  // Rounded corners
  rounded: "rounded-lg sm:rounded-xl",
  roundedFull: "rounded-full",
} as const;

/**
 * Utility function to combine responsive classes
 */
export function cn(...classes: (string | undefined | null | false)[]): string {
  return classes.filter(Boolean).join(' ');
}

/**
 * Responsive breakpoint utilities
 */
export const breakpoints = {
  mobile: '(max-width: 767px)',
  tablet: '(min-width: 768px) and (max-width: 1023px)',
  desktop: '(min-width: 1024px)',
  wide: '(min-width: 1280px)',
} as const;
