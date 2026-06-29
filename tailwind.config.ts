import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // Nina brand palette
        ink: "#0B1B2B",
        brand: {
          DEFAULT: "#1F8A4C",
          dark: "#156337",
          light: "#E8F5EC",
        },
        accent: "#13C28B",
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
      },
      maxWidth: {
        content: "72ch",
      },
    },
  },
  plugins: [],
};

export default config;
