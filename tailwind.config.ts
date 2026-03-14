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
        sans: ['Outfit', 'sans-serif'],
      },
      fontSize: {
        'lg': ['1.125rem', { lineHeight: '1.75rem' }],
      },
      colors: {
        // Main color for student (antiquewhite)
        antiquewhite: {
          DEFAULT: '#FAEBD7',
          50: '#FFF9F0',
          100: '#FFF3E0',
          200: '#FFE8CC',
          300: '#FFD9A8',
          400: '#FFC57A',
          500: '#FAD25E',
          600: '#E8B830',
          700: '#D49A1E',
          800: '#B07D16',
          900: '#8C6312',
        },
        // Main button color (green)
        primary: {
          DEFAULT: '#10B981',
          50: '#ECFDF5',
          100: '#D1FAE5',
          200: '#A7F3D0',
          300: '#6EE7B7',
          400: '#34D399',
          500: '#10B981',
          600: '#059669',
          700: '#047857',
          800: '#065F46',
          900: '#064E3B',
        },
        // Skyblue accents
        sky: {
          DEFAULT: '#87CEEB',
          50: '#F0F9FF',
          100: '#E0F2FE',
          200: '#BAE6FD',
          300: '#7DD3FC',
          400: '#38BDF8',
          500: '#0EA5E9',
          600: '#0284C7',
          700: '#0369A1',
          800: '#075985',
          900: '#0C4A6E',
        },
        // Beige color for backgrounds
        beige: {
          50: '#FDF8F0',
          100: '#FAF0E3',
          200: '#F5E1C8',
          300: '#EED3A8',
          400: '#E5C18A',
          500: '#DCB072',
        },
      },
    },
  },
  plugins: [],
};

export default config;
