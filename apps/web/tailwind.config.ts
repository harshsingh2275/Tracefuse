import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        linen: "#F7F4EE",
        surface: "#FFFFFF",
        "border-warm": "#E5E0D6",
        navy: {
          DEFAULT: "#1F3A5F",
          hover: "#152740",
          subtle: "#EBF1F8",
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
          primary: "#24211D",
          secondary: "#6B655A",
          muted: "#8C8578",
        },
        severity: {
          critical: {
            DEFAULT: "#8C2F2F",
            bg: "#F9EBEB",
            border: "#F0CECE",
          },
          suspicious: {
            DEFAULT: "#B8792F",
            bg: "#FAF3EA",
            border: "#F3E2CF",
          },
          normal: {
            DEFAULT: "#6B655A",
            bg: "#F2EFE9",
            border: "#E5E0D6",
          },
        },
        // Backward-compatible semantic bindings
        background: "#F7F4EE",
        foreground: "#24211D",
        card: "#FFFFFF",
        "card-border": "#E5E0D6",
        brand: {
          50: "#EBF1F8",
          500: "#1F3A5F",
          600: "#1F3A5F",
          700: "#152740",
        },
        risk: {
          low: "#6B655A",
          medium: "#B8792F",
          high: "#B8792F",
          critical: "#8C2F2F",
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
