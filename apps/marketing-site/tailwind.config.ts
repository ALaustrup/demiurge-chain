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
      fontFamily: {
        'orbitron': ['var(--font-orbitron)', 'sans-serif'],
        'rajdhani': ['var(--font-rajdhani)', 'sans-serif'],
        'body': ['var(--font-space-grotesk)', 'sans-serif'],
      },
      colors: {
        'demiurge-cyan': '#00f2ff',
        'demiurge-violet': '#7000ff',
        'demiurge-gold': '#ffd700',
        'demiurge-dark': '#0a0a0f',
        'neon-cyan': '#00ffff',
        'neon-magenta': '#ff00ff',
        'neon-yellow': '#ffff00',
        'neon-green': '#00ff88',
        'neon-purple': '#9d00ff',
        'neon-pink': '#ff0080',
        'blockchain-dark': '#050510',
        'blockchain-darker': '#020208',
        'blockchain-light': '#1a1a2e',
      },
      backdropBlur: {
        'glass': '20px',
      },
      animation: {
        'border-pulse': 'border-pulse 6s infinite alternate',
        'glow-pulse': 'glow-pulse 3s ease-in-out infinite',
        'gradient-shift': 'gradient-shift 8s ease infinite',
        'float': 'float 20s infinite ease-in-out',
        'wave': 'wave 10s ease-in-out infinite',
        'liquid-glow': 'liquid-glow 8s ease-in-out infinite',
        'neon-flicker': 'neon-flicker 3s ease-in-out infinite',
        'morph-border': 'morph-border 6s ease-in-out infinite',
      },
      keyframes: {
        'border-pulse': {
          '0%': { filter: 'hue-rotate(0deg) brightness(1)' },
          '100%': { filter: 'hue-rotate(45deg) brightness(1.5)' },
        },
        'glow-pulse': {
          '0%, 100%': { opacity: '0.5' },
          '50%': { opacity: '1' },
        },
        'gradient-shift': {
          '0%, 100%': { backgroundPosition: '0% 50%' },
          '50%': { backgroundPosition: '100% 50%' },
        },
        'float': {
          '0%, 100%': { transform: 'translateY(0px) translateX(0px)' },
          '25%': { transform: 'translateY(-20px) translateX(10px)' },
          '50%': { transform: 'translateY(-10px) translateX(-10px)' },
          '75%': { transform: 'translateY(-30px) translateX(5px)' },
        },
        'wave': {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        'liquid-glow': {
          '0%, 100%': { 
            filter: 'hue-rotate(0deg) brightness(1)',
            transform: 'scale(1)',
          },
          '25%': { 
            filter: 'hue-rotate(90deg) brightness(1.2)',
            transform: 'scale(1.05)',
          },
          '50%': { 
            filter: 'hue-rotate(180deg) brightness(1.5)',
            transform: 'scale(1.1)',
          },
          '75%': { 
            filter: 'hue-rotate(270deg) brightness(1.2)',
            transform: 'scale(1.05)',
          },
        },
        'neon-flicker': {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.8' },
        },
        'morph-border': {
          '0%, 100%': { 
            borderColor: 'rgba(0, 255, 255, 0.5)',
            boxShadow: '0 0 20px rgba(0, 255, 255, 0.3)',
          },
          '33%': { 
            borderColor: 'rgba(255, 0, 255, 0.5)',
            boxShadow: '0 0 20px rgba(255, 0, 255, 0.3)',
          },
          '66%': { 
            borderColor: 'rgba(0, 255, 136, 0.5)',
            boxShadow: '0 0 20px rgba(0, 255, 136, 0.3)',
          },
        },
      },
    },
  },
  plugins: [],
}

export default config
