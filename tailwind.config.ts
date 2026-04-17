import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ["var(--font-geist-sans)", "system-ui", "sans-serif"],
        mono: ["var(--font-geist-mono)", "monospace"],
      },
      colors: {
        // Sales Progressor design tokens
        surface: {
          DEFAULT: "#0f1117",
          raised: "#161b27",
          border: "#1e2535",
          hover: "#1a2133",
        },
        brand: {
          DEFAULT: "#3b82f6",
          dim: "#1d4ed8",
          muted: "rgba(59,130,246,0.1)",
        },
        status: {
          active: "#22c55e",
          on_hold: "#f59e0b",
          completed: "#6b7280",
          withdrawn: "#ef4444",
        },
      },
    },
  },
  plugins: [],
};

export default config;
