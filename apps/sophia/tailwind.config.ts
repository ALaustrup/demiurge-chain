import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}",
    "./lib/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: "#fdf3ff",
          100: "#fce7ff",
          200: "#f8d5ff",
          300: "#f3b3ff",
          400: "#ec7eff",
          500: "#e040fb",
          600: "#d500f9",
          700: "#b200e3",
          800: "#9100d4",
          900: "#7c3aed", // Sophia Purple
          950: "#600fb2",
        },
        navy: {
          50: "#f8fafc",
          100: "#f1f5f9",
          200: "#e2e8f0",
          300: "#cbd5e1",
          400: "#94a3b8",
          500: "#64748b",
          600: "#475569",
          700: "#334155",
          800: "#1e293b",
          900: "#0f172a", // Demiurge Navy
          950: "#020617",
        },
        cyan: {
          50: "#cffafe",
          100: "#a5f3fc",
          200: "#67e8f9",
          300: "#06b6d4", // Accent Cyan
          400: "#0891b2",
          500: "#0e7490",
          600: "#155e75",
          700: "#164e63",
          800: "#1e3a4c",
          900: "#164e63",
          950: "#0c2b3f",
        },
      },
      fontFamily: {
        sans: ["var(--font-geist-sans)"],
        mono: ["var(--font-geist-mono)"],
      },
      animation: {
        "fade-in": "fadeIn 0.5s ease-in",
        "slide-down": "slideDown 0.5s ease-out",
        "pulse-glow": "pulseGlow 2s cubic-bezier(0.4, 0, 0.6, 1) infinite",
        "float": "float 3s ease-in-out infinite",
        "shimmer": "shimmer 2s infinite",
      },
      keyframes: {
        fadeIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        slideDown: {
          "0%": { transform: "translateY(-10px)", opacity: "0" },
          "100%": { transform: "translateY(0)", opacity: "1" },
        },
        pulseGlow: {
          "0%, 100%": { boxShadow: "0 0 0 0 rgba(124, 58, 237, 0.7)" },
          "50%": { boxShadow: "0 0 0 10px rgba(124, 58, 237, 0)" },
        },
        float: {
          "0%, 100%": { transform: "translateY(0px)" },
          "50%": { transform: "translateY(-20px)" },
        },
        shimmer: {
          "0%": { backgroundPosition: "-1000px 0" },
          "100%": { backgroundPosition: "1000px 0" },
        },
      },
      backgroundImage: {
        "gradient-radial": "radial-gradient(var(--tw-gradient-stops))",
        "gradient-conic": "conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))",
        "glass-gradient": "linear-gradient(135deg, rgba(255, 255, 255, 0.1), rgba(255, 255, 255, 0.05))",
      },
      backdropFilter: {
        none: "none",
        sm: "blur(4px)",
        md: "blur(8px)",
        lg: "blur(12px)",
        xl: "blur(16px)",
      },
      borderRadius: {
        "3xl": "1.5rem",
        "4xl": "2rem",
      },
    },
  },
  plugins: [
    require("tailwindcss/plugin")(function ({ addUtilities }) {
      const newUtilities = {
        ".glass": {
          background: "rgba(255, 255, 255, 0.1)",
          "backdrop-filter": "blur(8px)",
          "-webkit-backdrop-filter": "blur(8px)",
          border: "1px solid rgba(255, 255, 255, 0.2)",
        },
        ".glass-dark": {
          background: "rgba(15, 23, 42, 0.8)",
          "backdrop-filter": "blur(8px)",
          "-webkit-backdrop-filter": "blur(8px)",
          border: "1px solid rgba(124, 58, 237, 0.2)",
        },
      };
      addUtilities(newUtilities);
    }),
  ],
};

export default config;
