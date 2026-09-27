/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        // Government Portal Primary Colors
        primary: {
          50: '#e6f0ff',
          100: '#cce0ff',
          200: '#99c2ff',
          300: '#66a3ff',
          400: '#3385ff',
          500: '#0066ff',
          600: '#0052cc',
          700: '#003d99',
          800: '#002966',
          900: '#001433'
        },
        secondary: {
          50: '#fff7ed',
          100: '#ffedd5',
          200: '#fed7aa',
          300: '#fdba74',
          400: '#fb923c',
          500: '#f97316',
          600: '#ea580c',
          700: '#c2410c',
          800: '#9a3412',
          900: '#7c2d12'
        },
        navy: {
          50: '#f0f4f8',
          100: '#d9e2ec',
          200: '#bcccdc',
          300: '#9fb3c8',
          400: '#829ab1',
          500: '#627d98',
          600: '#486581',
          700: '#334e68',
          800: '#243b53',
          900: '#102a43',
          950: '#0a1929'
        },
        // Legacy colors kept for backward compatibility
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
        dancing: ['Dancing Script', 'cursive'],
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
