// ═══════════════════════════════════════════════════════════════════
// Plately Design System Tokens
// ═══════════════════════════════════════════════════════════════════
// Central token definitions for the Plately ecosystem across
// Workshop (Next.js), Web (React), and mobile interfaces.

export const tokens = {
  colors: {
    brand: {
      primary: '#f98b25',       // Plately Saffron Orange
      primaryHover: '#e07a00',  // Deep amber
      primaryLight: '#ffa64d',  // Saffron gold highlight
      primaryMuted: 'rgba(249, 139, 37, 0.12)',
      surface: '#0D1117',       // Core dark slate canvas
      surfaceRaised: '#161b22', // Card background
      surfaceOverlay: '#1c2333',// Flyout / dialog surface
      surfaceSunken: '#090d13', // Deep sunken inputs / counters
      border: 'rgba(255, 255, 255, 0.06)',
      borderHover: 'rgba(255, 255, 255, 0.14)',
      borderActive: 'rgba(249, 139, 37, 0.45)',
    },
    text: {
      primary: '#f0f6fc',
      secondary: '#8b949e',
      muted: '#6e7681',
      brand: '#f98b25',
    },
    status: {
      success: '#22c55e',
      successMuted: 'rgba(34, 197, 94, 0.15)',
      warning: '#f59e0b',
      warningMuted: 'rgba(245, 158, 11, 0.15)',
      error: '#ef4444',
      errorMuted: 'rgba(239, 68, 68, 0.15)',
      info: '#3b82f6',
      infoMuted: 'rgba(59, 130, 246, 0.15)',
      rush: '#dc2626',
    },
    orderStatus: {
      confirmed: '#3b82f6',   // Blue
      preparing: '#f59e0b',   // Amber
      ready: '#22c55e',       // Green
      dispatched: '#8b5cf6',  // Purple
      delivering: '#a855f7',  // Violet
      picked_up: '#10b981',   // Emerald
      completed: '#64748b',   // Slate
      cancelled: '#ef4444',   // Red
      rejected: '#b91c1c',    // Dark Red
    },
  },

  radius: {
    xs: '4px',
    sm: '6px',
    md: '8px',
    lg: '12px',
    xl: '16px',
    full: '9999px',
  },

  breakpoints: {
    sm: '640px',
    md: '768px',
    lg: '1024px',
    xl: '1280px',
    '2xl': '1536px',
  },

  typography: {
    fontFamily: {
      sans: 'var(--font-sans, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif)',
      display: 'var(--font-display, inherit)',
      mono: 'var(--font-mono, ui-monospace, SFMono-Regular, Menlo, monospace)',
    },
    fontSize: {
      xs: '0.75rem',    // 12px
      sm: '0.875rem',   // 14px
      base: '1rem',      // 16px
      lg: '1.125rem',   // 18px
      xl: '1.25rem',    // 20px
      '2xl': '1.5rem',  // 24px
      '3xl': '1.875rem',// 30px
    },
  },
} as const;

export type DesignTokens = typeof tokens;
