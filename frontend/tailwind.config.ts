import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        primary: "#16A34A",       // Hospital Green
        secondary: "#22C55E",     // Light Green
        accent: "#0F766E",        // Teal Accent
        background: "#F8FAFC",    // Light slate bg
        cards: "#FFFFFF",
        sidebar: "#0F172A",       // Slate 900
        darkBg: "#0B0F19",        // Dark mode background
        darkCard: "#151F32",      // Dark mode cards
        textColor: "#1E293B",     // Slate 800
        mutedText: "#64748B",     // Slate 500
        borders: "#E2E8F0",
        darkBorders: "#1E293B",
        success: "#22C55E",
        warning: "#F59E0B",
        danger: "#EF4444",
      },
      fontFamily: {
        sans: ["Inter", "sans-serif"],
      },
    },
  },
  plugins: [],
};
export default config;
