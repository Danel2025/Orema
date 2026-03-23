import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: ["./app/**/*.{js,ts,jsx,tsx,mdx}", "./components/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        accent: {
          DEFAULT: "var(--accent)",
          light: "var(--accent-light)",
          dark: "var(--accent-dark)",
        },
        success: "var(--success)",
        warning: "var(--warning)",
        error: "var(--error)",
        info: "var(--info)",
      },
      fontFamily: {
        sans: ["var(--font-gabarito)", "ui-sans-serif", "system-ui"],
        body: ["var(--font-body)", "var(--font-gabarito)", "ui-sans-serif", "system-ui"],
        mono: ["var(--font-google-sans-code)", "ui-monospace", "monospace"],
      },
    },
  },
  plugins: [],
};

export default config;
