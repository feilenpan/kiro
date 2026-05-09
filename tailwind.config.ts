import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        gold: {
          50:  "#fdf8ec",
          100: "#f9edcc",
          200: "#f3d88a",
          300: "#ecc24a",
          400: "#e5ab28",
          500: "#c98a16",
          600: "#a06810",
          700: "#7a4c10",
          800: "#5e3a10",
          900: "#4a2d0e",
        },
        zen: {
          50:  "#faf7f2",
          100: "#f2ebe0",
          200: "#e4d4be",
          300: "#d1b48e",
          400: "#bc8f5e",
          500: "#a8733e",
          600: "#8a5a2f",
          700: "#6e4525",
          800: "#56341d",
          900: "#3e2614",
        },
        ink: {
          DEFAULT: "#2c1810",
          light:   "#5c3d2e",
          dark:    "#1a0f08",
        },
        parchment: "#f5f0e8",
      },
      fontFamily: {
        serif: ["Noto Serif SC", "Georgia", "serif"],
        sans:  ["Noto Sans SC", "sans-serif"],
      },
    },
  },
  plugins: [],
};

export default config;
