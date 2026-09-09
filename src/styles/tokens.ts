/**
 * Foundational Design Tokens for The Jayant Diaries
 * Represents both the cinematic public identity and functional studio aesthetics.
 */

export const tokens = {
  colors: {
    // Cinematic Public Palette
    cinema: {
      bg: "#0B0D0E", // Deep charcoal obsidian
      surface: "#121518", // Card and container surface
      elevated: "#181C22", // Modals, popovers, dropdowns
      border: "#232830", // Hairline division
      borderSubtle: "#1A1E24",
      text: "#F3F4F6", // Crisp editorial white
      textMuted: "#9CA3AF", // Secondary metadata
      accent: "#D97706", // Warm cinematic amber
      accentHover: "#B45309",
      accentGlow: "rgba(217, 119, 6, 0.15)",
    },
    // Studio Operational Palette
    studio: {
      bg: "#0D1117",
      surface: "#161B22",
      elevated: "#21262D",
      border: "#30363D",
      text: "#C9D1D9",
      textMuted: "#8B949E",
      accent: "#388BFD",
      success: "#2EA043",
      danger: "#F85149",
      warning: "#D29922",
    },
  },
  typography: {
    fontFamilies: {
      serif: 'Playfair Display, Georgia, serif',
      sans: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      mono: 'ui-monospace, SFMono-Regular, Menlo, monospace',
    },
    fontSizes: {
      hero: "3.5rem", // 56px
      title: "2.25rem", // 36px
      h2: "1.75rem", // 28px
      h3: "1.25rem", // 20px
      body: "1rem", // 16px
      small: "0.875rem", // 14px
      caption: "0.75rem", // 12px
    },
  },
  spacing: {
    xs: "0.25rem", // 4px
    sm: "0.5rem", // 8px
    md: "1rem", // 16px
    lg: "1.5rem", // 24px
    xl: "2rem", // 32px
    "2xl": "3rem", // 48px
    "3xl": "4rem", // 64px
  },
  radii: {
    none: "0",
    sm: "4px",
    md: "8px",
    lg: "12px",
    xl: "16px",
    full: "9999px",
  },
  zIndex: {
    hide: -1,
    base: 0,
    dock: 10,
    header: 40,
    drawer: 50,
    modal: 60,
    toast: 70,
    tooltip: 80,
  },
  motion: {
    duration: {
      fast: "150ms",
      normal: "300ms",
      cinematic: "600ms",
    },
    easing: {
      cinematic: "cubic-bezier(0.16, 1, 0.3, 1)",
      standard: "cubic-bezier(0.4, 0, 0.2, 1)",
    },
  },
} as const;
