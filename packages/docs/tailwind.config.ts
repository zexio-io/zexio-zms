import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './theme.config.jsx'
  ],
  theme: {
    extend: {
      colors: {
        background: 'oklch(var(--background) / <alpha-value>)',
        foreground: 'oklch(var(--foreground) / <alpha-value>)',
        primary: {
          DEFAULT: 'oklch(var(--primary) / <alpha-value>)',
          glow: 'oklch(var(--primary-glow) / <alpha-value>)'
        },
        surface: {
          DEFAULT: 'oklch(var(--surface) / <alpha-value>)',
          subtle: 'oklch(var(--surface-subtle) / <alpha-value>)'
        },
        border: 'oklch(var(--border) / <alpha-value>)'
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'hero-glow': 'radial-gradient(ellipse at top, oklch(var(--primary-glow) / 0.15), transparent 70%)',
      },
      fontFamily: {
        sans: ['var(--font-inter)', 'Inter', 'sans-serif'],
      }
    },
  },
  plugins: [],
};

export default config;
