import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
    '../../packages/ui-shared/src/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      // ═══════════════════════════════════════════════════════════════════════
      // "THE ARCHITECT" - Cyber-Industrial Design System
      // Typography: Rajdhani (Headings) + Barlow (Body) + JetBrains Mono (Data)
      // ═══════════════════════════════════════════════════════════════════════
      
      fontFamily: {
        // Headings - Sharp, tactical, uppercase-friendly
        'display': ['var(--font-rajdhani)', 'Rajdhani', 'system-ui', 'sans-serif'],
        'rajdhani': ['var(--font-rajdhani)', 'Rajdhani', 'system-ui', 'sans-serif'],
        
        // Body - Humanist grotesque for perfect legibility
        'body': ['var(--font-barlow)', 'Barlow', 'system-ui', 'sans-serif'],
        'sans': ['var(--font-barlow)', 'Barlow', 'system-ui', 'sans-serif'],
        
        // Data/Code - Sharp, distinct characters
        'mono': ['var(--font-mono)', 'JetBrains Mono', 'Fira Code', 'monospace'],
        'data': ['var(--font-mono)', 'JetBrains Mono', 'monospace'],
        
        // Forge/VYB - Stylized display fonts
        'grunge': ['"Permanent Marker"', '"Rock Salt"', 'var(--font-rajdhani)', 'cursive'],
        'grunge-alt': ['"Special Elite"', '"Courier Prime"', 'var(--font-rajdhani)', 'monospace'],
        
        // Legacy compatibility
        'orbitron': ['var(--font-rajdhani)', 'Rajdhani', 'system-ui', 'sans-serif'],
      },
      
      colors: {
        // ═══════════════════════════════════════════════════════════════════
        // "THE ARCHITECT" Color Palette - Dark Stealth Scheme
        // ═══════════════════════════════════════════════════════════════════
        
        // Background layers
        'architect': {
          bg: '#0B0C10',
          surface: '#1F2833',
          elevated: '#252D3A',
          input: '#151A21',
        },
        
        // Primary accent - Bright Orange
        'cyber': {
          DEFAULT: '#FF6A00',
          dim: '#CC5500',
          bright: '#FF8C33',
        },
        
        // Structural accent - Blood Red
        'steel': {
          DEFAULT: '#8B0000',
          dim: '#5C0000',
          light: '#B22222',
        },
        
        // Text hierarchy
        'ink': {
          high: '#FFFFFF',
          body: '#C5C6C7',
          muted: '#7B8794',
          dim: '#4A5568',
        },
        
        // Status colors - Desaturated, professional
        'signal': {
          success: '#22C55E',
          warning: '#E6A817',
          error: '#CF6679',
          info: '#FF6A00',
        },
        
        // Legacy color mappings for compatibility
        'void': {
          DEFAULT: '#0B0C10',
          deep: '#050505',
          surface: '#1F2833',
          elevated: '#252D3A',
        },
        
        'neon': {
          cyan: '#FF6A00',
          'cyan-dim': '#CC5500',
          purple: '#8B0000',
          'purple-dim': '#5C0000',
          white: '#FFFFFF',
          green: '#22C55E',
          magenta: '#CF6679',
          yellow: '#E6A817',
        },
        
        'status': {
          online: '#22C55E',
          warning: '#E6A817',
          error: '#CF6679',
          info: '#FF6A00',
        },
        
        'text': {
          primary: '#FFFFFF',
          secondary: '#C5C6C7',
          tertiary: '#7B8794',
          muted: '#4A5568',
        },
        
        // Demiurge accent colors
        'demiurge-gold': {
          DEFAULT: '#D4AF37',
          light: '#F0D060',
          dim: '#A68B28',
          dark: '#7A6520',
        },
        
        // More legacy mappings
        'deep-void': '#0B0C10',
        'holographic': '#FF6A00',
        'lavender': '#8B0000',
        'data-cyan': '#FF6A00',
        'data-magenta': '#CF6679',
        'data-green': '#22C55E',
        'data-gold': '#E6A817',
        'ultraviolet': '#252D3A',
        'obsidian': '#1F2833',
        'nebula': '#5C0000',
        
        // Dark variants for backgrounds
        'dark': {
          600: '#1F2833',
          700: '#151A21',
          800: '#0B0C10',
          900: '#050505',
        },
        
        // Blockchain theme colors
        'blockchain': {
          light: '#1F2833',
          dark: '#0B0C10',
        },
      },
      
      // Border radius - Industrial, sharp corners
      borderRadius: {
        'none': '0px',
        'sm': '2px',
        'DEFAULT': '2px',
        'md': '2px',
        'lg': '2px',
        'xl': '2px',
        '2xl': '2px',
        '3xl': '2px',
        'full': '2px',
      },
      
      spacing: {
        '18': '4.5rem',
        '88': '22rem',
        '112': '28rem',
        '128': '32rem',
      },
      
      boxShadow: {
        // Industrial shadows - subtle, structural
        'cyber': '0 0 20px rgba(255, 106, 0, 0.15)',
        'cyber-intense': '0 0 30px rgba(255, 106, 0, 0.25), 0 0 60px rgba(255, 106, 0, 0.1)',
        'steel': '0 4px 20px rgba(0, 0, 0, 0.5)',
        'inner-glow': 'inset 0 0 20px rgba(255, 106, 0, 0.05)',
        
        // Legacy mappings
        'neon-cyan': '0 0 20px rgba(255, 106, 0, 0.2)',
        'neon-cyan-intense': '0 0 30px rgba(255, 106, 0, 0.3)',
        'neon-purple': '0 0 20px rgba(139, 0, 0, 0.2)',
        'neon-white': '0 0 20px rgba(255, 255, 255, 0.1)',
        'glass': '0 4px 20px rgba(0, 0, 0, 0.4)',
        'glass-elevated': '0 8px 30px rgba(0, 0, 0, 0.5)',
        'status-online': '0 0 8px #22C55E',
        'status-error': '0 0 8px #CF6679',
        'status-warning': '0 0 8px #E6A817',
      },
      
      backdropBlur: {
        'glass': '12px',
        'ultra': '24px',
        'extreme': '40px',
      },
      
      animation: {
        'fade-in': 'fade-in 0.5s cubic-bezier(0.16, 1, 0.3, 1) forwards',
        'slide-up': 'slide-up 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards',
        'breathing': 'breathing 4s cubic-bezier(0.87, 0, 0.13, 1) infinite',
        'breathing-slow': 'breathing 8s cubic-bezier(0.87, 0, 0.13, 1) infinite',
        'glow-pulse': 'glow-pulse 3s cubic-bezier(0.87, 0, 0.13, 1) infinite',
        'float': 'float-subtle 6s cubic-bezier(0.87, 0, 0.13, 1) infinite',
        'float-slow': 'float-subtle 10s cubic-bezier(0.87, 0, 0.13, 1) infinite',
        'status-pulse': 'status-pulse 2s cubic-bezier(0.87, 0, 0.13, 1) infinite',
        'border-flow': 'border-flow 3s linear infinite',
        'pulse-neon': 'glow-pulse 2s cubic-bezier(0.87, 0, 0.13, 1) infinite',
        'data-pulse': 'breathing 2s cubic-bezier(0.87, 0, 0.13, 1) infinite',
        'scale-in': 'scale-in 0.4s cubic-bezier(0.34, 1.56, 0.64, 1) forwards',
        'spin-slow': 'spin 8s linear infinite',
      },
      
      keyframes: {
        'fade-in': {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        'slide-up': {
          '0%': { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'breathing': {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.85' },
        },
        'glow-pulse': {
          '0%, 100%': { boxShadow: '0 0 10px rgba(255, 106, 0, 0.2)' },
          '50%': { boxShadow: '0 0 20px rgba(255, 106, 0, 0.4)' },
        },
        'float-subtle': {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-4px)' },
        },
        'status-pulse': {
          '0%, 100%': { transform: 'scale(1)', opacity: '1' },
          '50%': { transform: 'scale(1.2)', opacity: '0.7' },
        },
        'border-flow': {
          '0%': { backgroundPosition: '0% 50%' },
          '100%': { backgroundPosition: '200% 50%' },
        },
        'scale-in': {
          '0%': { opacity: '0', transform: 'scale(0.95)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
      },
      
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'gradient-conic': 'conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))',
        'cyber-gradient': 'linear-gradient(135deg, #FF6A00 0%, #8B0000 100%)',
        'cyber-gradient-horizontal': 'linear-gradient(90deg, #FF6A00 0%, #8B0000 100%)',
        'void-radial': 'radial-gradient(ellipse at center, #1F2833 0%, #0B0C10 100%)',
        'void-spotlight': 'radial-gradient(ellipse at 50% 0%, rgba(255, 106, 0, 0.08) 0%, transparent 50%)',
        
        // Legacy
        'neon-gradient': 'linear-gradient(135deg, #FF6A00 0%, #8B0000 100%)',
        'neon-gradient-horizontal': 'linear-gradient(90deg, #FF6A00 0%, #8B0000 100%)',
        'border-shine': 'linear-gradient(135deg, rgba(255,255,255,0.1) 0%, transparent 50%)',
        'border-neon': 'linear-gradient(90deg, transparent 0%, #FF6A00 50%, transparent 100%)',
      },
      
      transitionTimingFunction: {
        'out-expo': 'cubic-bezier(0.16, 1, 0.3, 1)',
        'in-out-expo': 'cubic-bezier(0.87, 0, 0.13, 1)',
        'spring': 'cubic-bezier(0.34, 1.56, 0.64, 1)',
      },
      
      transitionDuration: {
        '400': '400ms',
        '600': '600ms',
      },
      
      letterSpacing: {
        'tactical': '1.5px',
        'wide': '0.1em',
        'wider': '0.15em',
      },
      
      fontSize: {
        'tactical': ['13px', { letterSpacing: '1.5px', fontWeight: '600' }],
        'body': ['15px', { lineHeight: '1.6' }],
        'data': ['14px', { letterSpacing: '-0.02em' }],
      },
    },
  },
  plugins: [],
}

export default config
