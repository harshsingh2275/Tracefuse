import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        linen: "rgb(var(--background-rgb) / <alpha-value>)",
        surface: "rgb(var(--surface-rgb) / <alpha-value>)",
        "border-warm": "rgb(var(--border-rgb) / <alpha-value>)",
        navy: {
          DEFAULT: "rgb(var(--accent-rgb) / <alpha-value>)",
          hover: "rgb(var(--accent-hover-rgb) / <alpha-value>)",
          subtle: "rgb(var(--accent-subtle-rgb) / <alpha-value>)",
          50: "#f0f4f8",
          100: "#d9e2ec",
          200: "#bcccdc",
          300: "#9fb3c8",
          400: "#829ab1",
          500: "#627d98",
          600: "#486581",
          700: "#334e68",
          800: "#1F3A5F",
          900: "#102a43",
        },
        ink: {
          primary: "rgb(var(--text-primary-rgb) / <alpha-value>)",
          secondary: "rgb(var(--text-secondary-rgb) / <alpha-value>)",
          muted: "rgb(var(--text-muted-rgb) / <alpha-value>)",
        },
        severity: {
          critical: {
            DEFAULT: "rgb(var(--severity-critical-rgb) / <alpha-value>)",
            bg: "rgb(var(--severity-critical-bg-rgb) / <alpha-value>)",
            border: "rgb(var(--severity-critical-border-rgb) / <alpha-value>)",
          },
          suspicious: {
            DEFAULT: "rgb(var(--severity-suspicious-rgb) / <alpha-value>)",
            bg: "rgb(var(--severity-suspicious-bg-rgb) / <alpha-value>)",
            border: "rgb(var(--severity-suspicious-border-rgb) / <alpha-value>)",
          },
          normal: {
            DEFAULT: "rgb(var(--severity-normal-rgb) / <alpha-value>)",
            bg: "rgb(var(--severity-normal-bg-rgb) / <alpha-value>)",
            border: "rgb(var(--severity-normal-border-rgb) / <alpha-value>)",
          },
        },
        // Backward-compatible semantic bindings
        background: "rgb(var(--background-rgb) / <alpha-value>)",
        foreground: "rgb(var(--text-primary-rgb) / <alpha-value>)",
        card: "rgb(var(--surface-rgb) / <alpha-value>)",
        "card-border": "rgb(var(--border-rgb) / <alpha-value>)",
        brand: {
          50: "rgb(var(--accent-subtle-rgb) / <alpha-value>)",
          500: "rgb(var(--accent-rgb) / <alpha-value>)",
          600: "rgb(var(--accent-rgb) / <alpha-value>)",
          700: "rgb(var(--accent-hover-rgb) / <alpha-value>)",
        },
        risk: {
          low: "rgb(var(--severity-normal-rgb) / <alpha-value>)",
          medium: "rgb(var(--severity-suspicious-rgb) / <alpha-value>)",
          high: "rgb(var(--severity-suspicious-rgb) / <alpha-value>)",
          critical: "rgb(var(--severity-critical-rgb) / <alpha-value>)",
        },
      },
      fontFamily: {
        serif: ["Fraunces", "Georgia", "serif"],
        heading: ["Fraunces", "Georgia", "serif"],
        sans: ["Inter", "system-ui", "-apple-system", "sans-serif"],
        mono: ["IBM Plex Mono", "ui-monospace", "SFMono-Regular", "monospace"],
      },
    },
  },
  plugins: [],
};

export default config;
