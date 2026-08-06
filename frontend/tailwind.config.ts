import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      fontFamily: {
        heading: ["var(--font-archivo)", "sans-serif"],
        body: ["var(--font-inter)", "sans-serif"],
        "heading-fa": ["var(--font-vazir)", "sans-serif"],
        "body-fa": ["var(--font-vazir)", "sans-serif"],
        sans: ["var(--font-inter)", "system-ui", "sans-serif"],
      },
      colors: {
        accent: "#B4E3BD",
        background: "#0A0A0A",
        surface: "#141414",
      },
      borderRadius: {
        card: "1.25rem",
      },
    },
  },
  plugins: [],
};

export default config;