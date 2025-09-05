import type { Config } from "tailwindcss";

export default {
  darkMode: ["class"],
  content: [
    "./pages/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./app/**/*.{ts,tsx}",
    "./src/**/*.{ts,tsx}",
  ],
  prefix: "",
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
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
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
        // Brand Colors
        raspberry: {
          DEFAULT: "#CF2B56",
          50: "#FCE9ED",
          100: "#F8D3DB",
          200: "#F0A7B7",
          300: "#E87B93",
          400: "#E04F6F",
          500: "#CF2B56",
          600: "#A62245",
          700: "#7D1A34",
          800: "#541123",
          900: "#2B0911",
        },
        sandstorm: {
          DEFAULT: "#E8CD53",
          50: "#FCF9E9",
          100: "#F9F3D3",
          200: "#F3E7A7",
          300: "#EDDB7B",
          400: "#E8CD53",
          500: "#E3BE2B",
          600: "#B69822",
          700: "#89721A",
          800: "#5C4C11",
          900: "#2F2609",
        },
        violet: {
          DEFAULT: "#25174F",
          50: "#E9E6F0",
          100: "#D3CCE1",
          200: "#A799C3",
          300: "#7B66A5",
          400: "#4F3387",
          500: "#25174F",
          600: "#1E1240",
          700: "#160E30",
          800: "#0F0920",
          900: "#070510",
        },
        motojojo: {
          red: "#DC2626",
        },
      },
      fontFamily: {
        sans: ['-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'Helvetica Neue', 'Arial', 'Noto Sans', 'sans-serif'],
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
        '2xl': '1rem',
        '3xl': '1.5rem',
        '4xl': '2rem',
      },
      boxShadow: {
        'soft': '0 4px 20px 0 rgba(0, 0, 0, 0.1)',
        'glow': '0 0 15px rgba(106, 13, 173, 0.5)',
        'glow-red': '0 0 15px rgba(255, 31, 76, 0.5)',
        'glow-yellow': '0 0 15px rgba(255, 195, 0, 0.5)',
      },
      keyframes: {
        'accordion-down': {
          from: { height: '0' },
          to: { height: 'var(--radix-accordion-content-height)' },
        },
        'accordion-up': {
          from: { height: 'var(--radix-accordion-content-height)' },
          to: { height: '0' },
        },
        'fade-in': {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        'slide-up': {
          '0%': { transform: 'translateY(10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        'slide-down': {
          '0%': { transform: 'translateY(-10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        'scale': {
          '0%': { transform: 'scale(0.95)', opacity: '0' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
        'pulse-gentle': {
          '0%, 100%': { transform: 'scale(1)' },
          '50%': { transform: 'scale(1.05)' },
        },
      },
      animation: {
        'accordion-down': 'accordion-down 0.2s ease-out',
        'accordion-up': 'accordion-up 0.2s ease-out',
        'fade-in': 'fade-in 0.3s ease-out',
        'slide-up': 'slide-up 0.3s ease-out',
        'slide-down': 'slide-down 0.3s ease-out',
        'scale': 'scale 0.3s ease-out',
        'pulse-gentle': 'pulse-gentle 2s infinite',
      },
      // Anti-aliasing utilities
      fontSmoothing: {
        'antialiased': {
          '-webkit-font-smoothing': 'antialiased',
          '-moz-osx-font-smoothing': 'grayscale',
        },
        'subpixel': {
          '-webkit-font-smoothing': 'auto',
          '-moz-osx-font-smoothing': 'auto',
        },
      },
      textRendering: {
        'optimize-legibility': 'optimizeLegibility',
        'optimize-speed': 'optimizeSpeed',
        'geometric-precision': 'geometricPrecision',
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
} satisfies Config;
