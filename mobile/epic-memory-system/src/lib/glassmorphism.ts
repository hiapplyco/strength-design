/**
 * Glassmorphism Design System
 * Premium glass effects and design tokens for web and mobile platforms
 */

// ===== GLASS EFFECTS =====
export const glass = {
  // Background glass effects with backdrop blur
  background: {
    light: "bg-white/80 backdrop-blur-xl",
    medium: "bg-white/60 backdrop-blur-lg", 
    heavy: "bg-white/40 backdrop-blur-md",
    dark: "bg-black/40 backdrop-blur-xl dark:bg-black/60",
    subtle: "bg-white/30 backdrop-blur-sm dark:bg-black/30",
  },

  // Glass card variants
  card: {
    default: [
      "bg-white/10 dark:bg-white/5",
      "backdrop-blur-md",
      "border border-white/20 dark:border-white/10",
      "shadow-xl shadow-black/5"
    ].join(" "),
    
    elevated: [
      "bg-white/15 dark:bg-white/10", 
      "backdrop-blur-lg",
      "border border-white/30 dark:border-white/15",
      "shadow-2xl shadow-black/10"
    ].join(" "),

    subtle: [
      "bg-white/5 dark:bg-black/20",
      "backdrop-blur-sm", 
      "border border-white/10 dark:border-white/5",
      "shadow-lg shadow-black/5"
    ].join(" "),

    interactive: [
      "bg-white/10 dark:bg-white/5",
      "backdrop-blur-md",
      "border border-white/20 dark:border-white/10", 
      "shadow-xl shadow-black/5",
      "transition-all duration-300",
      "hover:bg-white/15 dark:hover:bg-white/10",
      "hover:border-white/30 dark:hover:border-white/20",
      "hover:shadow-2xl hover:shadow-black/10"
    ].join(" "),
  },

  // Glass surfaces for different UI elements
  surface: {
    navbar: [
      "bg-white/70 dark:bg-gray-900/70",
      "backdrop-blur-xl",
      "border-b border-white/20 dark:border-white/10",
      "shadow-lg shadow-black/5"
    ].join(" "),

    sidebar: [
      "bg-white/80 dark:bg-gray-900/80",
      "backdrop-blur-xl",
      "border-r border-white/20 dark:border-white/10",
      "shadow-xl shadow-black/10"
    ].join(" "),

    modal: [
      "bg-white/90 dark:bg-gray-900/90",
      "backdrop-blur-2xl",
      "border border-white/30 dark:border-white/15",
      "shadow-2xl shadow-black/20"
    ].join(" "),

    dropdown: [
      "bg-white/95 dark:bg-gray-900/95",
      "backdrop-blur-xl",
      "border border-white/20 dark:border-white/10",
      "shadow-xl shadow-black/15"
    ].join(" "),

    overlay: "bg-black/20 backdrop-blur-sm",
  },

  // Glass button styles
  button: {
    primary: [
      "bg-gradient-to-r from-orange-500/80 to-orange-600/80",
      "backdrop-blur-md",
      "border border-white/20",
      "shadow-lg shadow-orange-500/20",
      "hover:from-orange-500/90 hover:to-orange-600/90",
      "hover:shadow-xl hover:shadow-orange-500/30",
      "transition-all duration-300"
    ].join(" "),

    secondary: [
      "bg-white/10 dark:bg-white/5",
      "backdrop-blur-md",
      "border border-white/20 dark:border-white/10",
      "hover:bg-white/20 dark:hover:bg-white/10",
      "transition-all duration-300"
    ].join(" "),

    ghost: [
      "bg-transparent",
      "border border-white/10 dark:border-white/5",
      "hover:bg-white/10 dark:hover:bg-white/5",
      "hover:border-white/20 dark:hover:border-white/10",
      "transition-all duration-300"
    ].join(" "),
  },

  // Input field glass styles
  input: {
    default: [
      "bg-white/10 dark:bg-black/20",
      "backdrop-blur-md",
      "border border-white/20 dark:border-white/10",
      "placeholder:text-gray-500 dark:placeholder:text-gray-400",
      "focus:bg-white/20 dark:focus:bg-black/30",
      "focus:border-orange-500/50",
      "focus:ring-2 focus:ring-orange-500/20",
      "transition-all duration-300"
    ].join(" "),

    filled: [
      "bg-white/20 dark:bg-black/30",
      "backdrop-blur-sm",
      "border border-transparent",
      "focus:border-orange-500/50",
      "focus:ring-2 focus:ring-orange-500/20",
      "transition-all duration-300"
    ].join(" "),
  },
} as const;

// ===== GLASS GRADIENTS =====
export const gradients = {
  // Premium gradients for glass effects
  glass: {
    sunrise: "from-orange-400/20 via-pink-500/20 to-purple-600/20",
    ocean: "from-blue-400/20 via-cyan-500/20 to-teal-600/20",
    forest: "from-green-400/20 via-emerald-500/20 to-teal-600/20",
    lavender: "from-purple-400/20 via-pink-500/20 to-rose-600/20",
    midnight: "from-indigo-900/20 via-purple-900/20 to-pink-900/20",
  },

  // Accent gradients for interactive elements
  accent: {
    primary: "from-orange-500 to-orange-600",
    success: "from-green-500 to-emerald-600",
    danger: "from-red-500 to-rose-600",
    info: "from-blue-500 to-indigo-600",
    warning: "from-yellow-500 to-amber-600",
  },

  // Background gradients
  background: {
    light: "from-gray-50 via-white to-gray-50",
    dark: "from-gray-900 via-gray-950 to-black",
    mesh: [
      "bg-[radial-gradient(at_top_left,_var(--tw-gradient-stops))]",
      "from-orange-100/20 via-transparent to-transparent"
    ].join(" "),
  },
} as const;

// ===== GLASS SHADOWS =====
export const glassShadows = {
  sm: "shadow-lg shadow-black/5",
  md: "shadow-xl shadow-black/10",
  lg: "shadow-2xl shadow-black/15",
  xl: "shadow-[0_20px_70px_-15px_rgba(0,0,0,0.3)]",
  
  // Colored shadows
  colored: {
    orange: "shadow-xl shadow-orange-500/10",
    blue: "shadow-xl shadow-blue-500/10",
    green: "shadow-xl shadow-green-500/10",
    purple: "shadow-xl shadow-purple-500/10",
  },

  // Glow effects
  glow: {
    sm: "shadow-[0_0_20px_rgba(251,146,60,0.15)]",
    md: "shadow-[0_0_40px_rgba(251,146,60,0.2)]",
    lg: "shadow-[0_0_60px_rgba(251,146,60,0.25)]",
  },
} as const;

// ===== GLASS BORDERS =====
export const glassBorders = {
  subtle: "border border-white/10 dark:border-white/5",
  default: "border border-white/20 dark:border-white/10",
  strong: "border border-white/30 dark:border-white/15",
  gradient: "border border-gradient-to-r from-white/30 via-white/10 to-white/30",
} as const;

// ===== GLASS ANIMATIONS =====
export const glassAnimations = {
  // Shimmer effect
  shimmer: {
    animation: "shimmer 3s ease-in-out infinite",
    keyframes: `
      @keyframes shimmer {
        0% { background-position: -200% center; }
        100% { background-position: 200% center; }
      }
    `,
    className: [
      "relative overflow-hidden",
      "before:absolute before:inset-0",
      "before:bg-gradient-to-r before:from-transparent before:via-white/10 before:to-transparent",
      "before:bg-[length:200%_100%]",
      "before:animate-shimmer"
    ].join(" "),
  },

  // Pulse glow
  pulseGlow: {
    animation: "pulse-glow 2s cubic-bezier(0.4, 0, 0.6, 1) infinite",
    keyframes: `
      @keyframes pulse-glow {
        0%, 100% { opacity: 1; box-shadow: 0 0 20px rgba(251,146,60,0.15); }
        50% { opacity: 0.8; box-shadow: 0 0 40px rgba(251,146,60,0.3); }
      }
    `,
  },

  // Float effect
  float: {
    animation: "float 6s ease-in-out infinite",
    keyframes: `
      @keyframes float {
        0%, 100% { transform: translateY(0px); }
        50% { transform: translateY(-10px); }
      }
    `,
  },
} as const;

// ===== GLASS UTILITIES =====
export const glassUtils = {
  // Blur utilities
  blur: {
    none: "backdrop-blur-none",
    sm: "backdrop-blur-sm",
    md: "backdrop-blur-md",
    lg: "backdrop-blur-lg",
    xl: "backdrop-blur-xl",
    "2xl": "backdrop-blur-2xl",
    "3xl": "backdrop-blur-3xl",
  },

  // Opacity utilities for glass
  opacity: {
    glass: {
      5: "bg-white/5 dark:bg-white/5",
      10: "bg-white/10 dark:bg-white/10",
      15: "bg-white/15 dark:bg-white/15",
      20: "bg-white/20 dark:bg-white/20",
      30: "bg-white/30 dark:bg-white/30",
      40: "bg-white/40 dark:bg-white/40",
    },
  },

  // Noise texture overlay
  noise: [
    "before:absolute before:inset-0",
    "before:bg-[url('data:image/svg+xml,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%22100%22%20height%3D%22100%22%3E%3Cfilter%20id%3D%22noise%22%3E%3CfeTurbulence%20type%3D%22fractalNoise%22%20baseFrequency%3D%220.9%22%20numOctaves%3D%224%22%20%2F%3E%3C%2Ffilter%3E%3Crect%20width%3D%22100%22%20height%3D%22100%22%20filter%3D%22url(%23noise)%22%20opacity%3D%220.02%22%2F%3E%3C%2Fsvg%3E')]",
    "before:opacity-20",
    "before:pointer-events-none",
    "relative"
  ].join(" "),
} as const;

// ===== COMPONENT PRESETS =====
export const glassPresets = {
  // Complete card preset
  card: {
    base: glass.card.default,
    hover: glass.card.interactive,
    shadow: glassShadows.md,
    border: glassBorders.default,
  },

  // Navigation preset
  nav: {
    surface: glass.surface.navbar,
    shadow: glassShadows.sm,
    border: glassBorders.subtle,
  },

  // Modal preset
  modal: {
    overlay: glass.surface.overlay,
    content: glass.surface.modal,
    shadow: glassShadows.xl,
    border: glassBorders.strong,
  },

  // Button preset
  button: {
    primary: glass.button.primary,
    secondary: glass.button.secondary,
    ghost: glass.button.ghost,
  },

  // Input preset
  input: {
    default: glass.input.default,
    filled: glass.input.filled,
  },
} as const;

// ===== EXPORT TYPE HELPERS =====
export type GlassKey = keyof typeof glass;
export type GradientKey = keyof typeof gradients;
export type GlassShadowKey = keyof typeof glassShadows;
export type GlassBorderKey = keyof typeof glassBorders;
export type GlassPresetKey = keyof typeof glassPresets;