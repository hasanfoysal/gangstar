import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['var(--font-sans)', 'var(--font-bengali)', 'system-ui', 'sans-serif'],
      },
      colors: {
        brand: {
          50: '#eef6ff',
          100: '#d9ebff',
          200: '#bcddff',
          500: '#2b6cb0',
          600: '#1e4e8c',
          700: '#1a365d',
          800: '#132847',
          900: '#0b192c',
        },
        amber: {
          500: '#d97706',
          600: '#b45309',
        },
      },
    },
  },
  plugins: [],
};

export default config;
