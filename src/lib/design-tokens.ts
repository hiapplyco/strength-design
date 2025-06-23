import { type ClassValue } from "clsx";

/**
 * Design System Tokens
 * Centralized design tokens for consistent styling across the application
 */

// ===== COLOR SYSTEM =====
export const colors = {
  // Brand Colors
  primary: {
    DEFAULT: "hsl(25 95% 53%)",        // Warm orange - sunset inspired
    foreground: "hsl(0 0% 100%)",      // White text on primary
    50: "hsl(25 95% 95%)",
    100: "hsl(25 95% 90%)",
    200: "hsl(25 95% 80%)",
    300: "hsl(25 95% 70%)",
    400: "hsl(25 95% 60%)",
    500: "hsl(25 95% 53%)",            // Default
    600: "hsl(25 95% 45%)",
    700: "hsl(25 95% 38%)",
    800: "hsl(25 95% 30%)",
    900: "hsl(25 95% 20%)",
  },
  
  // Semantic Colors
  success: {
    DEFAULT: "hsl(142 71% 45%)",       // Green for achievements
    light: "hsl(142 71% 95%)",
    dark: "hsl(142 71% 35%)",
    foreground: "hsl(0 0% 100%)",
  },
  
  warning: {
    DEFAULT: "hsl(38 92% 50%)",        // Amber for warnings
    light: "hsl(38 92% 95%)",
    dark: "hsl(38 92% 40%)",
    foreground: "hsl(38 92% 10%)",
  },
  
  danger: {
    DEFAULT: "hsl(0 72% 51%)",         // Red for errors/destructive
    light: "hsl(0 72% 95%)",
    dark: "hsl(0 72% 41%)",
    foreground: "hsl(0 0% 100%)",
  },
  
  // Gradient System
  gradients: {
    border: "from-[#4CAF50] via-[#9C27B0] to-[#FF1493]",
    sunset: "from-orange-400 via-red-500 to-pink-500",
    energy: "from-yellow-400 via-orange-500 to-red-500",
    success: "from-green-400 to-green-600",
    premium: "from-amber-400 via-orange-500 to-red-500",
  }
} as const;

// ===== TYPOGRAPHY SCALE =====
export const typography = {
  // Display headings
  display: {
    h1: "text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight",
    h2: "text-3xl sm:text-4xl lg:text-5xl font-semibold tracking-tight",
    h3: "text-2xl sm:text-3xl lg:text-4xl font-semibold",
    h4: "text-xl sm:text-2xl lg:text-3xl font-medium",
    h5: "text-lg sm:text-xl lg:text-2xl font-medium",
    h6: "text-base sm:text-lg lg:text-xl font-medium",
  },
  
  // Body text
  body: {
    default: "text-sm sm:text-base",
    large: "text-base sm:text-lg",
    small: "text-xs sm:text-sm",
  },
  
  // Special text
  label: "text-sm font-medium",
  caption: "text-xs text-muted-foreground",
  button: "text-sm font-medium",
  
  // Responsive utilities
  responsive: {
    title: "text-lg sm:text-xl lg:text-2xl font-semibold",
    subtitle: "text-sm sm:text-base text-muted-foreground",
    body: "text-sm sm:text-base",
  }
} as const;

// ===== SPACING SYSTEM =====
export const spacing = {
  // Component padding
  component: {
    xs: "p-2",
    sm: "p-3",
    md: "p-4",
    lg: "p-6",
    xl: "p-8",
  },
  
  // Page sections
  section: {
    mobile: "py-4 px-4",
    tablet: "sm:py-6 sm:px-6",
    desktop: "lg:py-8 lg:px-8",
    default: "py-2 sm:py-3 lg:py-4 px-2 sm:px-4",
  },
  
  // Gaps between elements
  gap: {
    xs: "gap-2",
    sm: "gap-3",
    md: "gap-4",
    lg: "gap-6",
    xl: "gap-8",
    responsive: {
      sm: "gap-2 sm:gap-3",
      md: "gap-3 sm:gap-4",
      lg: "gap-4 sm:gap-6",
    }
  },
  
  // Margin utilities
  margin: {
    section: "mb-6 sm:mb-8",
    element: "mb-3 sm:mb-4",
    text: "mb-2",
  }
} as const;

// ===== SIZE SYSTEM =====
export const sizes = {
  // Icon sizes
  icon: {
    xs: "h-3 w-3",
    sm: "h-4 w-4",
    md: "h-5 w-5",
    lg: "h-6 w-6",
    xl: "h-8 w-8",
    responsive: {
      sm: "h-3 w-3 sm:h-4 sm:w-4",
      md: "h-4 w-4 sm:h-5 sm:w-5",
      lg: "h-5 w-5 sm:h-6 sm:w-6",
    }
  },
  
  // Touch targets (minimum 44x44px)
  touch: {
    target: "min-w-[44px] min-h-[44px]",
    iconButton: "w-10 h-10 sm:w-9 sm:h-9",
    interactive: "p-3 -m-1", // Increases touch area
  },
  
  // Container widths
  container: {
    xs: "max-w-xs",
    sm: "max-w-sm",
    md: "max-w-md",
    lg: "max-w-lg",
    xl: "max-w-xl",
    "2xl": "max-w-2xl",
    "3xl": "max-w-3xl",
    "4xl": "max-w-4xl",
    "5xl": "max-w-5xl",
    "6xl": "max-w-6xl",
    "7xl": "max-w-7xl",
    full: "max-w-full",
    prose: "max-w-prose",
  }
} as const;

// ===== BORDER RADIUS =====
export const radius = {
  none: "rounded-none",
  sm: "rounded-sm",
  md: "rounded-md",
  lg: "rounded-lg",
  xl: "rounded-xl",
  "2xl": "rounded-2xl",
  full: "rounded-full",
} as const;

// ===== SHADOWS =====
export const shadows = {
  sm: "shadow-sm",
  md: "shadow-md",
  lg: "shadow-lg",
  xl: "shadow-xl",
  "2xl": "shadow-2xl",
  inner: "shadow-inner",
  none: "shadow-none",
  
  // Custom shadows
  card: "shadow-sm hover:shadow-md transition-shadow",
  elevated: "shadow-lg",
  glow: "shadow-[0_0_15px_rgba(196,160,82,0.1)]",
} as const;

// ===== ANIMATION PRESETS =====
export const animations = {
  // Page transitions
  pageIn: {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -20 },
    transition: { duration: 0.2 }
  },
  
  // Component animations
  fadeIn: {
    initial: { opacity: 0 },
    animate: { opacity: 1 },
    transition: { duration: 0.2 }
  },
  
  slideIn: {
    initial: { x: -20, opacity: 0 },
    animate: { x: 0, opacity: 1 },
    transition: { duration: 0.3 }
  },
  
  slideUp: {
    initial: { y: 20, opacity: 0 },
    animate: { y: 0, opacity: 1 },
    transition: { duration: 0.3 }
  },
  
  // Interactive elements
  tap: {
    whileTap: { scale: 0.98 },
    transition: { duration: 0.1 }
  },
  
  hover: {
    whileHover: { scale: 1.02 },
    transition: { duration: 0.2 }
  },
  
  // Loading sequences
  pulse: {
    animate: { scale: [1, 1.05, 1] },
    transition: { repeat: Infinity, duration: 2 }
  },
  
  spin: {
    animate: { rotate: 360 },
    transition: { repeat: Infinity, duration: 1, ease: "linear" }
  }
} as const;

// ===== TRANSITIONS =====
export const transitions = {
  fast: "transition-all duration-150",
  default: "transition-all duration-200",
  slow: "transition-all duration-300",
  
  // Specific transitions
  colors: "transition-colors duration-200",
  transform: "transition-transform duration-200",
  opacity: "transition-opacity duration-200",
  shadow: "transition-shadow duration-200",
} as const;

// ===== Z-INDEX SCALE =====
export const zIndex = {
  behind: "-z-10",
  base: "z-0",
  dropdown: "z-10",
  sticky: "z-20",
  fixed: "z-30",
  modalBackdrop: "z-40",
  modal: "z-50",
  popover: "z-50",
  tooltip: "z-50",
  notification: "z-60",
} as const;

// ===== RESPONSIVE UTILITIES =====
export const responsive = {
  // Hide/Show utilities
  hideOnMobile: "hidden sm:block",
  showOnMobile: "block sm:hidden",
  hideOnTablet: "hidden md:block",
  showOnTablet: "block md:hidden",
  
  // Grid layouts
  grid: {
    1: "grid-cols-1",
    2: "grid-cols-1 sm:grid-cols-2",
    3: "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3",
    4: "grid-cols-1 sm:grid-cols-2 lg:grid-cols-4",
    auto: "grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4",
  },
  
  // Flex layouts
  flex: {
    mobileColumn: "flex flex-col sm:flex-row",
    tabletColumn: "flex flex-col md:flex-row",
    responsive: "flex flex-col sm:flex-row items-start sm:items-center",
  },
  
  // Text alignment
  text: {
    center: "text-center",
    mobileCenter: "text-center sm:text-left",
    tabletCenter: "text-center md:text-left",
  }
} as const;

// ===== COMPONENT VARIANTS =====
export const variants = {
  // Card variants
  card: {
    default: [
      "relative rounded-md bg-card text-card-foreground shadow-sm overflow-hidden",
      "before:absolute before:inset-0 before:rounded-md",
      "before:bg-gradient-to-r before:from-[#4CAF50] before:via-[#9C27B0] before:to-[#FF1493]",
      "before:p-[1px] before:-z-10",
      "after:absolute after:inset-[1px] after:rounded-[calc(0.375rem-1px)]",
      "after:bg-card after:-z-[5]"
    ].join(" "),
    
    ghost: "rounded-md bg-card/50 backdrop-blur-sm border border-border/50",
    
    elevated: "rounded-md bg-card shadow-lg border border-border/20",
    
    interactive: [
      "rounded-md bg-card border border-border/50",
      "transition-all duration-200",
      "hover:border-primary/50 hover:shadow-md hover:scale-[1.02]"
    ].join(" "),
    
    flat: "rounded-md bg-card border border-border",
  },
  
  // Button sizes
  button: {
    size: {
      xs: "h-7 px-2 text-xs",
      sm: "h-9 px-3 text-sm",
      default: "h-10 px-4 text-sm",
      lg: "h-11 px-8 text-base",
      xl: "h-12 px-10 text-lg",
    }
  },
  
  // Input variants
  input: {
    default: "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
    ghost: "flex h-10 w-full rounded-md bg-transparent px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50",
  },
  
  // Badge variants
  badge: {
    default: "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
    primary: "border-transparent bg-primary text-primary-foreground",
    secondary: "border-transparent bg-secondary text-secondary-foreground",
    success: "border-transparent bg-green-500 text-white",
    warning: "border-transparent bg-amber-500 text-white",
    danger: "border-transparent bg-red-500 text-white",
    outline: "text-foreground",
  }
} as const;

// ===== EXPORT TYPE HELPERS =====
export type ColorKey = keyof typeof colors;
export type TypographyKey = keyof typeof typography;
export type SpacingKey = keyof typeof spacing;
export type SizeKey = keyof typeof sizes;
export type AnimationKey = keyof typeof animations;
export type VariantKey = keyof typeof variants;