/**
 * Design System Tokens
 * Based on Government Healthcare Portal Design
 */

export const colors = {
  // Primary - Deep Blue (Government Portal Style)
  primary: {
    50: '#e6f0ff',
    100: '#cce0ff',
    200: '#99c2ff',
    300: '#66a3ff',
    400: '#3385ff',
    500: '#0066ff', // Main primary
    600: '#0052cc',
    700: '#003d99',
    800: '#002966',
    900: '#001433',
    950: '#000a1a'
  },
  
  // Secondary - Orange (CTA Buttons)
  secondary: {
    50: '#fff7ed',
    100: '#ffedd5',
    200: '#fed7aa',
    300: '#fdba74',
    400: '#fb923c',
    500: '#f97316', // Main orange
    600: '#ea580c',
    700: '#c2410c',
    800: '#9a3412',
    900: '#7c2d12'
  },
  
  // Navy - Dark Professional Background
  navy: {
    50: '#f0f4f8',
    100: '#d9e2ec',
    200: '#bcccdc',
    300: '#9fb3c8',
    400: '#829ab1',
    500: '#627d98',
    600: '#486581',
    700: '#334e68', // Main navy
    800: '#243b53',
    900: '#102a43',
    950: '#0a1929'
  },
  
  // Success, Warning, Error
  success: '#10b981',
  warning: '#f59e0b',
  error: '#ef4444',
  info: '#3b82f6',
  
  // Neutral Grays
  gray: {
    50: '#f9fafb',
    100: '#f3f4f6',
    200: '#e5e7eb',
    300: '#d1d5db',
    400: '#9ca3af',
    500: '#6b7280',
    600: '#4b5563',
    700: '#374151',
    800: '#1f2937',
    900: '#111827'
  },
  
  // Background & Text
  background: {
    primary: '#ffffff',
    secondary: '#f9fafb',
    dark: '#0a1929',
    navy: '#102a43'
  },
  
  text: {
    primary: '#111827',
    secondary: '#4b5563',
    tertiary: '#9ca3af',
    inverse: '#ffffff'
  }
}

export const typography = {
  fontFamily: {
    sans: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif",
    heading: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif",
    mono: "'JetBrains Mono', 'Fira Code', monospace"
  },
  
  fontSize: {
    xs: '0.75rem',      // 12px
    sm: '0.875rem',     // 14px
    base: '1rem',       // 16px
    lg: '1.125rem',     // 18px
    xl: '1.25rem',      // 20px
    '2xl': '1.5rem',    // 24px
    '3xl': '1.875rem',  // 30px
    '4xl': '2.25rem',   // 36px
    '5xl': '3rem',      // 48px
    '6xl': '3.75rem',   // 60px
    '7xl': '4.5rem'     // 72px
  },
  
  fontWeight: {
    light: 300,
    normal: 400,
    medium: 500,
    semibold: 600,
    bold: 700,
    extrabold: 800
  },
  
  lineHeight: {
    tight: 1.2,
    normal: 1.5,
    relaxed: 1.75,
    loose: 2
  }
}

export const spacing = {
  0: '0',
  1: '0.25rem',   // 4px
  2: '0.5rem',    // 8px
  3: '0.75rem',   // 12px
  4: '1rem',      // 16px
  5: '1.25rem',   // 20px
  6: '1.5rem',    // 24px
  8: '2rem',      // 32px
  10: '2.5rem',   // 40px
  12: '3rem',     // 48px
  16: '4rem',     // 64px
  20: '5rem',     // 80px
  24: '6rem',     // 96px
  32: '8rem',     // 128px
  40: '10rem',    // 160px
  48: '12rem',    // 192px
  56: '14rem',    // 224px
  64: '16rem'     // 256px
}

export const borderRadius = {
  none: '0',
  sm: '0.25rem',    // 4px
  default: '0.375rem', // 6px
  md: '0.5rem',     // 8px
  lg: '0.75rem',    // 12px
  xl: '1rem',       // 16px
  '2xl': '1.5rem',  // 24px
  full: '9999px'
}

export const shadows = {
  sm: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
  default: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
  md: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
  lg: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
  xl: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
  '2xl': '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
  inner: 'inset 0 2px 4px 0 rgba(0, 0, 0, 0.06)',
  none: 'none'
}

export const breakpoints = {
  sm: '640px',
  md: '768px',
  lg: '1024px',
  xl: '1280px',
  '2xl': '1536px'
}

// Component-specific tokens
export const components = {
  button: {
    primary: {
      bg: colors.secondary[500],
      bgHover: colors.secondary[600],
      text: colors.text.inverse,
      borderRadius: borderRadius.md
    },
    secondary: {
      bg: colors.primary[600],
      bgHover: colors.primary[700],
      text: colors.text.inverse,
      borderRadius: borderRadius.md
    },
    outline: {
      border: colors.primary[600],
      text: colors.primary[600],
      bgHover: colors.primary[50],
      borderRadius: borderRadius.md
    }
  },
  
  card: {
    bg: colors.background.primary,
    border: colors.gray[200],
    borderRadius: borderRadius.lg,
    shadow: shadows.md,
    padding: spacing[6]
  },
  
  input: {
    border: colors.gray[300],
    borderFocus: colors.primary[500],
    bg: colors.background.primary,
    text: colors.text.primary,
    placeholder: colors.gray[400],
    borderRadius: borderRadius.md
  },
  
  badge: {
    success: {
      bg: '#d1fae5',
      text: '#065f46'
    },
    warning: {
      bg: '#fef3c7',
      text: '#92400e'
    },
    error: {
      bg: '#fee2e2',
      text: '#991b1b'
    },
    info: {
      bg: '#dbeafe',
      text: '#1e40af'
    }
  }
}

export default {
  colors,
  typography,
  spacing,
  borderRadius,
  shadows,
  breakpoints,
  components
}
