import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./hooks/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}"
  ],
  theme: {
    extend: {
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))"
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))"
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))"
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))"
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))"
        },
        danger: {
          DEFAULT: "hsl(var(--danger))",
          foreground: "hsl(var(--danger-foreground))"
        }
      },
      borderRadius: {
        lg: "16px",
        md: "12px",
        sm: "8px"
      },
      boxShadow: {
        soft: "0 10px 30px rgba(5, 8, 18, 0.08)",
        glass: "0 20px 40px rgba(8, 12, 30, 0.12)"
      },
      keyframes: {
        pulseRing: {
          "0%": { transform: "scale(0.92)", opacity: "0.7" },
          "100%": { transform: "scale(1.05)", opacity: "0" }
        }
      },
      animation: {
        pulseRing: "pulseRing 1s ease-out infinite"
      }
    }
  },
  plugins: []
};

export default config;

