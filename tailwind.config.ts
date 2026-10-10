import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50: "#e8f7f0",
          100: "#c6ebd9",
          200: "#92dcbc",
          300: "#5ecb9f",
          400: "#2bb882",
          500: "#00a884", // WhatsApp Primary Green
          600: "#008f70",
          700: "#00765c",
          800: "#005c48",
          900: "#004234",
          dark: "#128c7e",
          accent: "#25d366",
        },
      },
      fontFamily: {
        sans: [
          "Inter",
          "ui-sans-serif",
          "system-ui",
          "-apple-system",
          "BlinkMacSystemFont",
          '"Segoe UI"',
          "Roboto",
          '"Helvetica Neue"',
          "Arial",
          "sans-serif",
        ],
      },
    },
  },
  plugins: [],
};

export default config;
