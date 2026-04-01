import type { Config } from 'tailwindcss'
import animate from 'tailwindcss-animate'

const config: Config = {
  // Tema dark com sistema e light/dark classes
  darkMode: ['class'],
  content: [
    './app/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './lib/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      // Cores Hubstry
      colors: {
        'hubstry': {
          'blue': '#00D4FF',    // Azul neon primário
          'navy': '#0A0A1A',    // Fundo dark
          'accent': '#00FF88',  // Verde neon
          'danger': '#FF0055',  // Vermelho neon
          'surface': {
            light: '#F8FAFC',
            dark: '#111127',
          },
        },
        // Paleta expandida
        'primary': '#00D4FF',
        'secondary': '#0A0A1A',
        'accent': '#00FF88',
        'danger': '#FF0055',
      },
      backgroundColor: {
        DEFAULT: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        card: 'hsl(var(--card))',
        'card-foreground': 'hsl(var(--card-foreground))',
      },
      textColor: {
        DEFAULT: 'hsl(var(--foreground))',
        muted: 'hsl(var(--muted-foreground))',
      },
      borderColor: {
        DEFAULT: 'hsl(var(--border))',
      },
      // Animações customizadas
      animation: {
        'fade-in': 'fadeIn 0.3s ease-in-out',
        'slide-up': 'slideUp 0.3s ease-out',
        'slide-down': 'slideDown 0.3s ease-out',
        'pulse-glow': 'pulseGlow 2s ease-in-out infinite',
        'bounce-soft': 'bounceSoft 1s ease-in-out infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        slideDown: {
          '0%': { transform: 'translateY(-10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        pulseGlow: {
          '0%, 100%': { boxShadow: '0 0 0 0 rgba(0, 212, 255, 0.7)' },
          '50%': { boxShadow: '0 0 0 10px rgba(0, 212, 255, 0)' },
        },
        bounceSoft: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-5px)' },
        },
      },
      // Sombras customizadas
      boxShadow: {
        'glow-blue': '0 0 20px rgba(0, 212, 255, 0.5)',
        'glow-green': '0 0 20px rgba(0, 255, 136, 0.5)',
        'glow-red': '0 0 20px rgba(255, 0, 85, 0.5)',
      },
      // Gradientes
      backgroundImage: {
        'gradient-hubstry': 'linear-gradient(135deg, #00D4FF 0%, #00FF88 100%)',
        'gradient-dark': 'linear-gradient(135deg, #0A0A1A 0%, #111127 100%)',
      },
      // Spacing
      spacing: {
        'sidebar': '250px',
        'sidebar-collapsed': '80px',
      },
      // Transições
      transitionDuration: {
        '200': '200ms',
        '300': '300ms',
        '400': '400ms',
      },
    },
  },
  plugins: [animate],
}

export default config
