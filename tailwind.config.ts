import type { Config } from "tailwindcss";

export default {
  darkMode: ["class"],
  content: ["./pages/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./app/**/*.{ts,tsx}", "./src/**/*.{ts,tsx}"],
  prefix: "",
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "#C4A052", // Champion Gold
          foreground: "#000000", // Power Black
        },
        secondary: {
          DEFAULT: "#707070", // Steel Gray
          foreground: "#FFFFFF", // Victory White
        },
        destructive: {
          DEFAULT: "#FF4A4A", // Varsity Red
          foreground: "#FFFFFF",
        },
        destructiveSecondary: {
          DEFAULT: "#CC0000", // Crimson Red
          foreground: "#FFFFFF",
        },
        muted: {
          DEFAULT: "#222222", // Shadow Black
          foreground: "#FFFFFF", // Victory White
        },
        accent: {
          DEFAULT: "#A88B45", // Muted Gold
          foreground: "#222222", // Shadow Black
        },
        card: {
          DEFAULT: "#000000", // Power Black
          foreground: "#FFFFFF", // Victory White
        },
      },
      fontFamily: {
        sans: ["'Roboto Condensed'", "sans-serif"],
        collegiate: ["'Bebas Neue'", "sans-serif"]
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
        "fade-in": {
          from: { opacity: "0" },
          to: { opacity: "1" },
        },
        "fade-out": {
          from: { opacity: "1" },
          to: { opacity: "0" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        "fade-in": "fade-in 0.2s ease-out",
        "fade-out": "fade-out 0.2s ease-out",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
} satisfies Config;