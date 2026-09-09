import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/features/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        cinema: {
          bg: "#0B0D0E",
          surface: "#121518",
          elevated: "#181C22",
          border: "#232830",
          "border-subtle": "#1A1E24",
          text: "#F3F4F6",
          muted: "#9CA3AF",
          accent: "#D97706",
          "accent-hover": "#B45309",
          "accent-glow": "rgba(217, 119, 6, 0.15)",
        },
        studio: {
          bg: "#0D1117",
          surface: "#161B22",
          elevated: "#21262D",
          border: "#30363D",
          text: "#C9D1D9",
          muted: "#8B949E",
          accent: "#388BFD",
        },
      },
      fontFamily: {
        serif: ["var(--font-serif)", "Georgia", "Cambria", "serif"],
        sans: ["var(--font-sans)", "-apple-system", "BlinkMacSystemFont", "Segoe UI", "sans-serif"],
        mono: ["var(--font-mono)", "ui-monospace", "SFMono-Regular", "monospace"],
      },
      letterSpacing: {
        cinematic: "0.2em",
        editorial: "0.08em",
      },
      borderRadius: {
        sm: "4px",
        md: "8px",
        lg: "12px",
        xl: "16px",
      },
      transitionTimingFunction: {
        cinematic: "cubic-bezier(0.16, 1, 0.3, 1)",
      },
      keyframes: {
        fadeIn: {
          "0%": { opacity: "0", transform: "translateY(6px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
      },
      animation: {
        "fade-in": "fadeIn 0.35s cubic-bezier(0.16, 1, 0.3, 1) forwards",
      },
    },
  },
  plugins: [],
};

export default config;
