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
      fontSize: {
        'xs': ['0.8125rem', { lineHeight: '1.25rem' }],      // 13px (was 12px)
        'sm': ['0.9375rem', { lineHeight: '1.375rem' }],     // 15px (was 14px)
        'base': ['1.0625rem', { lineHeight: '1.625rem' }],   // 17px (was 16px)
        'lg': ['1.1875rem', { lineHeight: '1.75rem' }],      // 19px (was 18px)
        'xl': ['1.3125rem', { lineHeight: '1.875rem' }],     // 21px (was 20px)
        '2xl': ['1.5625rem', { lineHeight: '2rem' }],        // 25px (was 24px)
        '3xl': ['1.9375rem', { lineHeight: '2.375rem' }],    // 31px (was 30px)
        '4xl': ['2.375rem', { lineHeight: '2.75rem' }],      // 38px (was 36px)
        '5xl': ['3.0625rem', { lineHeight: '1' }],           // 49px (was 48px)
        '6xl': ['3.8125rem', { lineHeight: '1' }],           // 61px (was 60px)
        '7xl': ['4.8125rem', { lineHeight: '1' }],           // 77px (was 72px)
        '8xl': ['6.0625rem', { lineHeight: '1' }],           // 97px (was 96px)
        '9xl': ['8.0625rem', { lineHeight: '1' }],           // 129px (was 128px)
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