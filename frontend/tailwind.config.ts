import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./features/**/*.{ts,tsx}",
    "./services/**/*.{ts,tsx}",
    "./store/**/*.{ts,tsx}"
  ],
  theme: {
    extend: {
      colors: {
        // Legacy tokens kept for backward compat
        surface: "#f9f8fe",
        "surface-container-low": "#f4f3fb",
        "surface-container-highest": "#e4e1ef",
        "on-surface": "#1b1b24",
        outline: "#777588",
        "outline-variant": "#c7c4d9",
        primary: "#3b2ae1",
        "primary-container": "#554bf9",
        tertiary: "#3c5900",
        "tertiary-fixed": "#b7f644",
        error: "#ba1a1a",
        // New design tokens
        "rb-primary": "#3b2ae1",
        "rb-primary-dark": "#2d1fc7",
        "rb-accent": "#554bf9",
        "rb-surface": "#f9f8fe",
        "rb-text": "#1b1b24",
        "rb-text-secondary": "#464556",
        "rb-muted": "#777588",
        "rb-border": "rgba(199,196,217,0.55)",
        "rb-success": "#1f6d42",
        "rb-danger": "#b54b36"
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)"
      },
      fontFamily: {
        headline: ["var(--font-inter)", "sans-serif"],
        body: ["var(--font-inter)", "sans-serif"],
        label: ["var(--font-manrope)", "sans-serif"]
      },
      boxShadow: {
        "rb-card": "0 2px 12px rgba(59,42,225,0.06), 0 1px 3px rgba(0,0,0,0.04)",
        "rb-card-hover": "0 8px 32px rgba(59,42,225,0.10), 0 2px 8px rgba(0,0,0,0.05)"
      },
      maxWidth: {
        "page": "1200px"
      },
      spacing: {
        "page-x": "1.5rem"
      }
    }
  },
  plugins: []
};

export default config;
