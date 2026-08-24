/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        teal: {
          50:  '#f0fdf9',
          100: '#ccfbef',
          200: '#99f6df',
          300: '#5DCAA5',
          400: '#2dd4bf',
          500: '#0F6E56',
          600: '#0d5e49',
          700: '#0a4e3c',
          800: '#083d2f',
          900: '#062d22',
        },
        coral: {
          50:  '#fff5f1',
          100: '#ffe8e0',
          200: '#F0997B',
          300: '#e87a5a',
          400: '#e06040',
          500: '#D85A30',
          600: '#b84a28',
          700: '#983b20',
          800: '#782c18',
          900: '#581d10',
        },
        indigo: {
          50:  '#f0efff',
          100: '#e0deff',
          200: '#c1bcff',
          300: '#a29bff',
          400: '#837aff',
          500: '#3C3489',
          600: '#332d76',
          700: '#2a2562',
          800: '#211d4f',
          900: '#18153b',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      spacing: {
        '18': '4.5rem',
      },
      borderRadius: {
        card: '16px',
        btn: '10px',
      },
      boxShadow: {
        card: '0 1px 3px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.04)',
        'card-hover': '0 4px 12px rgba(15,110,86,0.10), 0 2px 4px rgba(0,0,0,0.06)',
        modal: '0 20px 40px rgba(0,0,0,0.15)',
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'fade-in': 'fadeIn 0.25s ease-out',
        'slide-up': 'slideUp 0.25s ease-out',
        'float': 'float 6s ease-in-out infinite',
      },
      keyframes: {
        fadeIn: { from: { opacity: 0 }, to: { opacity: 1 } },
        slideUp: { from: { opacity: 0, transform: 'translateY(8px)' }, to: { opacity: 1, transform: 'translateY(0)' } },
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-12px)' },
        },
      },
    },
  },
  plugins: [],
}
