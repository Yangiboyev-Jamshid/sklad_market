/** @type {import('tailwindcss').Config} */
export default {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    screens: {
      xs: "420px",
      sm: "640px",
      md: "768px",
      lg: "1024px",
      xl: "1280px",
      "2xl": "1536px",
    },
    extend: {
      colors: {
        brand: {
          50: "#EFF4FF",
          100: "#DCE7FF",
          200: "#BBD2FF",
          300: "#8FB4FF",
          400: "#5C8DFF",
          500: "#3B6FF6",
          600: "#2563EB",
          700: "#1D4FC4",
          800: "#1B3F95",
          900: "#1A3674",
        },
        surface: {
          DEFAULT: "#F8F9FB",
          subtle: "#F1F3F6",
          card: "#FFFFFF",
          dark: "#0B1220",
          darkCard: "#121A2B",
          darkSubtle: "#16213A",
        },
        ink: {
          950: "#0B1220",
          900: "#101828",
          800: "#1C2536",
          700: "#344054",
          600: "#475467",
          500: "#667085",
          400: "#98A2B3",
          300: "#D0D5DD",
          200: "#E4E7EC",
          100: "#F0F1F3",
          50: "#F8F9FB",
        },
        success: {
          50: "#ECFDF3",
          400: "#32D583",
          500: "#12B76A",
          600: "#039855",
          700: "#067647",
        },
        danger: {
          50: "#FEF3F2",
          100: "#FEE4E2",
          400: "#F97066",
          500: "#F04438",
          600: "#D92D20",
        },
        warning: {
          50: "#FFFAEB",
          400: "#FDB022",
          500: "#F79009",
          600: "#DC6803",
        },
        topbar: "#44464A",
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "-apple-system", "sans-serif"],
        display: ["'Plus Jakarta Sans'", "Inter", "sans-serif"],
      },
      boxShadow: {
        card: "0 1px 2px 0 rgba(16, 24, 40, 0.05)",
        popover: "0 12px 24px -6px rgba(16,24,40,0.12), 0 4px 8px -2px rgba(16,24,40,0.08)",
        nav: "0 1px 3px 0 rgba(16,24,40,0.08)",
      },
      borderRadius: {
        xl2: "1.25rem",
      },
      keyframes: {
        "gradient-pan": {
          "0%, 100%": { backgroundPosition: "0% 50%" },
          "50%": { backgroundPosition: "100% 50%" },
        },
      },
      animation: {
        "gradient-pan": "gradient-pan 8s ease infinite",
      },
    },
  },
  plugins: [],
};
