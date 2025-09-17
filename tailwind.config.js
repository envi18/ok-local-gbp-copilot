/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        primary: '#f45a4e',
        secondary: {
          start: '#667eea',
          end: '#764ba2'
        },
        success: {
          start: '#11998e',
          end: '#38ef7d'
        },
        warning: {
          start: '#f093fb',
          end: '#f5576c'
        }
      },
      screens: {
        'xs': '475px',
      },
      backdropBlur: {
        xs: '2px',
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      }
    },
  },
  plugins: [],
};