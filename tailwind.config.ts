import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  darkMode: "media",
  theme: {
    extend: {
      colors: {
        accent: {
          DEFAULT: "#0f6b4f",
          hover: "#0b523c",
          light: "#e6f4ea",
          dark: "#144534",
        },
        trade: {
          buy: "#10b981",
          buyBg: "#d1fae5",
          buyDarkBg: "#064e3b",
          buyDarkText: "#6ee7b7",
          sell: "#ef4444",
          sellBg: "#fee2e2",
          sellDarkBg: "#7f1d1d",
          sellDarkText: "#fca5a5",
        },
      },
    },
  },
  plugins: [],
};

export default config;
