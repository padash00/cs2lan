import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          DEFAULT: '#ff5500',
          dark: '#cc4400',
        },
      },
    },
  },
  plugins: [],
};

export default config;
