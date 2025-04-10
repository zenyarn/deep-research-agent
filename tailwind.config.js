/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ["class"],
  content: [
    "./pages/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./app/**/*.{ts,tsx}",
    "./src/**/*.{ts,tsx}",
  ],
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      colors: {
        primary: {
          DEFAULT: "#1e40af", // 深蓝色
          50: "#eff6ff",
          100: "#dbeafe",
          200: "#bfdbfe",
          300: "#93c5fd",
          400: "#60a5fa",
          500: "#3b82f6",
          600: "#2563eb",
          700: "#1d4ed8",
          800: "#1e40af",
          900: "#1e3a8a",
          950: "#172554",
        },
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
      },
      typography: {
        DEFAULT: {
          css: {
            color: "#f8fafc", // slate-100 for dark mode
            a: {
              color: "#60a5fa", // blue-400
              "&:hover": {
                color: "#93c5fd", // blue-300
              },
            },
            h1: {
              color: "#ffffff",
              fontWeight: "700",
            },
            h2: {
              color: "#ffffff",
              fontWeight: "600",
            },
            h3: {
              color: "#ffffff",
              fontWeight: "600",
            },
            h4: {
              color: "#ffffff",
              fontWeight: "600",
            },
            code: {
              color: "#e2e8f0", // slate-200
              backgroundColor: "#334155", // slate-700
              padding: "0.25rem",
              borderRadius: "0.25rem",
              fontWeight: "400",
            },
            "code::before": {
              content: '""',
            },
            "code::after": {
              content: '""',
            },
            blockquote: {
              color: "#cbd5e1", // slate-300
              borderLeftColor: "#475569", // slate-600
            },
            strong: {
              color: "#f1f5f9", // slate-50
              fontWeight: "600",
            },
            pre: {
              backgroundColor: "#1e293b", // slate-800
              color: "#e2e8f0", // slate-200
              padding: "1rem",
            },
            ul: {
              color: "#f8fafc", // slate-100
            },
            ol: {
              color: "#f8fafc", // slate-100
            },
            li: {
              color: "#f8fafc", // slate-100
            },
          },
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      keyframes: {
        "accordion-down": {
          from: { height: 0 },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: 0 },
        },
        "collapsible-down": {
          "0%": { height: "0" },
          "100%": { height: "var(--radix-collapsible-content-height)" },
        },
        "collapsible-up": {
          "0%": { height: "var(--radix-collapsible-content-height)" },
          "100%": { height: "0" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        "collapsible-down": "collapsible-down 0.2s ease-out",
        "collapsible-up": "collapsible-up 0.2s ease-out",
      },
    },
  },
  plugins: [require("tailwindcss-animate"), require("@tailwindcss/typography")],
};
