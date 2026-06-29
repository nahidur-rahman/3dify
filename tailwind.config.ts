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
        background: "var(--background)",
        foreground: "var(--foreground)",
        primary: {
          50: "#eaf5f5",
          100: "#c8e2e1",
          200: "#a6cecb",
          300: "#84bab6",
          400: "#62a6a0",
          500: "#40928b",
          600: "#33756f",
          700: "#265753",
          800: "#0C4E4B", // Brand color
          900: "#093a38",
          950: "#062725",
        },
        accent: {
          DEFAULT: "#EF9B24", // Gold/Orange for deals
          hover: "#d9881d",
        },
        surface: {
          DEFAULT: "#FAF6F0",
          base: "#F5EFEB",
        },
        dark: {
          DEFAULT: "#0f172a",
          100: "#1e293b",
          200: "#334155",
          300: "#475569",
        },
      },
      fontFamily: {
        sans: ["Outfit", "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [],
};
export default config;
