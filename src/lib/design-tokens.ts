
import { type ClassValue } from "clsx";

/**
 * Design System Tokens
 * Centralized design tokens for consistent styling across the application
 */

// ===== COLOR SYSTEM =====
export const colors = {
  // Brand Colors - Unified palette for light/dark modes
  primary: {
    DEFAULT: "hsl(24 95% 53%)",        // #F97316 - Energetic orange
    foreground: "hsl(0 0% 100%)",      // White text on primary
    50: "hsl(34 100% 96%)",            // #FFF4E6
    100: "hsl(34 100% 92%)",           // #FFE4CC
    200: "hsl(33 100% 84%)",           // #FFC899
    300: "hsl(30 100% 74%)",           // #FFA366
    400: "hsl(27 100% 64%)",           // #FF7D33
    500: "hsl(24 95% 53%)",            // #F97316 - Default
    600: "hsl(21 90% 48%)",            // #EA580C
    700: "hsl(17 88% 40%)",            // #C2410C
    800: "hsl(15 79% 34%)",            // #9A3412
    900: "hsl(15 75% 28%)",            // #7C2D12
  },
  
  // Neutral Colors - Works in both themes
  neutral: {
    50: "hsl(0 0% 98%)",               // #FAFAFA
    100: "hsl(0 0% 96%)",              // #F5F5F5
    200: "hsl(0 0% 90%)",              // #E5E5E5
    300: "hsl(0 0% 83%)",              // #D4D4D4
    400: "hsl(0 0% 64%)",              // #A3A3A3
    500: "hsl(0 0% 45%)",              // #737373
    600: "hsl(0 0% 32%)",              // #525252
    700: "hsl(0 0% 25%)",              // #404040
    800: "hsl(0 0% 15%)",              // #262626
    900: "hsl(0 0% 9%)",               // #171717
    950: "hsl(0 0% 4%)",               // #0A0A0A
  },
  
  // Semantic Colors
  success: {
    DEFAULT: "hsl(142 71% 45%)",       // #10B981
    light: "hsl(142 76% 93%)",         // #D1FAE5
    dark: "hsl(142 84% 35%)",          // #059669
    foreground: "hsl(0 0% 100%)",
  },
  
  error: {
    DEFAULT: "hsl(0 84% 60%)",         // #EF4444
    light: "hsl(0 86% 94%)",           // #FEE2E2
    dark: "hsl(0 73% 50%)",            // #DC2626
    foreground: "hsl(0 0% 100%)",
  },
  
  warning: {
    DEFAULT: "hsl(45 93% 47%)",        // #F59E0B
    light: "hsl(45 100% 94%)",         // #FEF3C7
    dark: "hsl(35 92% 42%)",           // #D97706
    foreground: "hsl(0 0% 100%)",
  },
  
  info: {
    DEFAULT: "hsl(217 91% 60%)",       // #3B82F6
    light: "hsl(214 95% 93%)",         // #DBEAFE
    dark: "hsl(221 83% 53%)",          // #2563EB
    foreground: "hsl(0 0% 100%)",
  },
  
  // Gradient System
  gradients: {
    primary: "from-primary-400 to-primary-600",
    surface: "from-neutral-50 to-neutral-100 dark:from-neutral-900 dark:to-neutral-800",
    success: "from-success-light to-success",
    glass: "from-white/10 to-white/5",
    // The signature multicolor gradient used across the app
    multicolor: "from-[#4CAF50] via-[#9C27B0] to-[#FF1493]",
    // Gold gradient for premium features
    gold: "from-[#DAA520] to-[#FFD700]",
  },
  
  // Individual hex colors for specific use cases
  hex: {
    // Multicolor gradient colors
    green: "#4CAF50",
    purple: "#9C27B0", 
    pink: "#FF1493",
    // Gold colors
    gold: "#DAA520",
    goldLight: "#FFD700",
    goldBrown: "#C4A052",
    // Chart/data visualization colors
    chartGreen: "#22c55e",
    chartBlue: "#3b82f6",
    chartOrange: "#f59e0b",
    chartRed: "#ef4444",
    chartPurple: "#8b5cf6",
    chartPurpleDark: "#7c3aed",
    // Social media brand colors
    facebook: "#4285F4",
    twitter: "#1DA1F2",
    instagram: "#E1306C",
    // Legacy colors (to be phased out)
    legacyGray: "#e0e0e0",
    legacyGrayDark: "#999",
    legacyDarkText: "#333",
    legacyGrayMed: "#666",
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
  // Brutalist/neo-brutalist shadows
  brutal: {
    sm: "shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]",
    md: "shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]",
    lg: "shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]",
  },
  // Soft shadows
  soft: {
    sm: "shadow-[0_2px_8px_0_rgba(0,0,0,0.08)]",
    md: "shadow-[0_4px_16px_0_rgba(0,0,0,0.12)]",
    lg: "shadow-[0_8px_32px_0_rgba(0,0,0,0.16)]",
  }
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
/**
 * Z-Index Hierarchy Documentation
 * 
 * Layer Structure (from bottom to top):
 * 
 * BACKGROUND LAYER (-10 to 0):
 * - behind: Elements that should appear behind content (decorative backgrounds)
 * - base: Default content layer
 * 
 * CONTENT LAYER (10 to 30):
 * - content: Interactive content elements (dropdowns, tooltips)
 * - elevated: Content that needs to appear above other content
 * - floating: Floating action buttons, badges
 * 
 * UI LAYER (30 to 50):
 * - sticky: Sticky headers, navigation
 * - fixed: Fixed position elements (navbar, footer)
 * - overlay: Modal/dialog overlays and backdrops
 * - sidebar: Sidebar navigation panel
 * - modal: Modal dialogs, sheets, drawers
 * 
 * INTERACTION LAYER (50 to 70):
 * - popover: Popovers, dropdowns, tooltips that appear above modals
 * - sidebarToggle: Sidebar toggle button (above sidebar)
 * - notification: Toast notifications, alerts
 * - critical: Critical system messages, loading screens
 */
export const zIndex = {
  // Background elements (-10 to 0)
  behind: "-z-10",
  base: "z-0",
  
  // Content elements (10 to 30)
  content: "z-10",              // Dropdowns, tooltips
  elevated: "z-20",             // Cards that lift on hover
  floating: "z-30",             // Floating action buttons
  
  // UI layer (30 to 50)
  sticky: "z-30",               // Sticky headers
  fixed: "z-30",                // Fixed navbar, footer
  overlay: "z-40",              // Modal backdrops, overlays
  sidebar: "z-45",              // Sidebar panel
  modal: "z-50",                // Modals, dialogs, sheets
  
  // Interaction layer (50 to 70)
  popover: "z-50",              // Popovers, select dropdowns
  sidebarToggle: "z-55",        // Sidebar toggle (above sidebar)
  notification: "z-60",         // Toast notifications
  critical: "z-70",             // Critical system overlays
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
  // Card variants - Simplified and refined
  card: {
    default: "rounded-lg bg-card text-card-foreground shadow-sm border border-border",
    
    ghost: "rounded-lg bg-card/50 backdrop-blur-sm border border-border/50",
    
    elevated: "rounded-lg bg-card shadow-lg border border-border/20",
    
    interactive: [
      "rounded-lg bg-card border border-border",
      "transition-all duration-200",
      "hover:border-primary/20 hover:shadow-md"
    ].join(" "),
    
    flat: "rounded-lg bg-card border border-border",
    
    // New gradient variant for special cards
    gradient: [
      "rounded-lg bg-gradient-to-br from-primary-500/10 to-primary-600/5",
      "border border-primary/20",
      "shadow-sm"
    ].join(" "),
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

// ===== Z-INDEX TYPE HELPERS =====
export type ZIndexKey = keyof typeof zIndex;
export type ZIndexValue = typeof zIndex[ZIndexKey];

// ===== EXPORT TYPE HELPERS =====
export type ColorKey = keyof typeof colors;
export type TypographyKey = keyof typeof typography;
export type SpacingKey = keyof typeof spacing;
export type SizeKey = keyof typeof sizes;
export type AnimationKey = keyof typeof animations;
export type VariantKey = keyof typeof variants;
