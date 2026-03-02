/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ["class"],
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
    "./public/index.html"
  ],
  theme: {
    extend: {
      colors: {
        background: '#FDFBF7',
        foreground: '#0F172A',
        primary: {
          DEFAULT: '#4F46E5',
          foreground: '#FFFFFF'
        },
        secondary: {
          DEFAULT: '#A3E635',
          foreground: '#000000'
        },
        accent: {
          DEFAULT: '#EC4899',
          foreground: '#FFFFFF'
        },
        muted: {
          DEFAULT: '#F1F5F9',
          foreground: '#64748B'
        },
        card: {
          DEFAULT: '#FFFFFF',
          foreground: '#0F172A'
        },
        border: '#000000',
        input: '#E2E8F0',
        ring: '#000000'
      },
      fontFamily: {
        sans: ['DM Sans', 'sans-serif'],
        heading: ['Unbounded', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace']
      },
      boxShadow: {
        'hard': '4px 4px 0px 0px rgba(0,0,0,1)',
        'hard-hover': '6px 6px 0px 0px rgba(0,0,0,1)',
        'hard-lg': '8px 8px 0px 0px rgba(0,0,0,1)',
        'button': '2px 2px 0px 0px rgba(0,0,0,1)'
      }
    }
  },
  plugins: [require("tailwindcss-animate")]
};