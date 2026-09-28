/**
 * Design System Tokens
 * Based on Government Healthcare Portal Design
 */

export const colors = {
  // PRIMARY: Government Navy (Locked Design) - #123B6D
  primary: {
    50: '#e8eef5',
    100: '#d1dce9',
    200: '#a3b9d4',
    300: '#7596be',
    400: '#4773a9',
    500: '#123B6D', // Main Government Navy - LOCKED
    600: '#0f3059',
    700: '#0b2445',
    800: '#081830',
    900: '#040c1c',
    950: '#02060e'
  },
  
  // ACCENT: Swasthya Orange (Locked Design) - #E85D04
  accent: {
    50: '#fef3e6',
    100: '#fde7cc',
    200: '#fbcf99',
    300: '#f9b766',
    400: '#f79f33',
    500: '#E85D04', // Main Swasthya Orange - LOCKED
    600: '#ba4a03',
    700: '#8b3802',
    800: '#5d2502',
    900: '#2e1301'
  },
  
  // BACKGROUND
  background: {
    primary: '#FFFFFF',
    secondary: '#F5F7FA',
    dark: '#123B6D',
    navy: '#123B6D'
  },
  
  // TEXT
  text: {
    primary: '#172B4D',
    secondary: '#52657A',
    tertiary: '#9ca3af',
    inverse: '#ffffff'
  },
  
  // SEMANTIC COLORS
  success: '#198754',
  warning: '#D98C00',
  critical: '#D92D20',
  error: '#D92D20',
  info: '#1677C8',
  
  // BORDER
  border: '#D9E1EA',
  surface: '#FFFFFF'
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
      bg: '#E85D04', // Swasthya Orange - LOCKED
      bgHover: '#ba4a03',
      text: '#ffffff',
      borderRadius: '6px'
    },
    secondary: {
      bg: '#ffffff',
      bgHover: '#F5F7FA',
      text: '#123B6D',
      border: '#123B6D',
      borderRadius: '6px'
    },
    tertiary: {
      bg: 'transparent',
      text: '#123B6D',
      textHover: '#E85D04',
      borderRadius: '6px'
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
