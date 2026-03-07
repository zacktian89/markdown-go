/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./src/web/index.html",
    "./src/**/*.{ts,tsx}"
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ["SF Pro Display", "SF Pro Text", "-apple-system", "BlinkMacSystemFont", "Helvetica Neue", "PingFang SC", "Microsoft YaHei", "sans-serif"],
        mono: ["SF Mono", "Menlo", "Monaco", "Consolas", "Courier New", "monospace"]
      },
      colors: {
        bg: "rgb(var(--bg) / <alpha-value>)",
        fg: "rgb(var(--fg) / <alpha-value>)",
        muted: "rgb(var(--muted) / <alpha-value>)",
        card: "rgb(var(--card) / <alpha-value>)",
        border: "rgb(var(--border) / <alpha-value>)",
        accent: "rgb(var(--accent) / <alpha-value>)",
        sidebar: "rgb(var(--sidebar) / <alpha-value>)"
      },
      boxShadow: {
        soft: "0 2px 15px -3px rgba(0, 0, 0, 0.07), 0 4px 6px -2px rgba(0, 0, 0, 0.02)"
      }
    }
  },
  plugins: []
};
