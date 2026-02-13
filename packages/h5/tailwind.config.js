/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      animation: {
        'spin-slow': 'spin 20s linear infinite',
        'spin-reverse': 'spin-reverse 15s linear infinite',
        'pulse-glow': 'pulse-glow 3s ease-in-out infinite',
        'twinkle': 'twinkle 2s ease-in-out infinite',
        'twinkle-delay': 'twinkle 2s ease-in-out infinite 0.5s',
        'breathe': 'breathe 4s ease-in-out infinite',
        'breathe-reverse': 'breathe 4s ease-in-out infinite reverse',
        'breathe-shadow': 'breathe-shadow 4s ease-in-out infinite',
        'float': 'float 3s ease-in-out infinite',
        'float-delay': 'float 4s ease-in-out infinite 1s',
        'float-delay-2': 'float 4.5s ease-in-out infinite 2s',
        'toast-in': 'toast-in 0.3s ease-out',
        'blink': 'blink 1s infinite',
        'glow-pulse': 'glow-pulse 4s ease-in-out infinite',
        'glow-pulse-delayed': 'glow-pulse-delayed 3s ease-in-out infinite 0.5s',
        'rotate-slow': 'rotate-slow 15s linear infinite',
        'rotate-slow-reverse': 'rotate-slow-reverse 20s linear infinite',
        'highlight-pulse': 'highlight-pulse 4s ease-in-out infinite',
        'shimmer': 'shimmer 8s linear infinite',
        'particle': 'particle 3s ease-in-out infinite',
      },
      keyframes: {
        'spin-reverse': {
          from: { transform: 'rotate(360deg)' },
          to: { transform: 'rotate(0deg)' },
        },
        'pulse-glow': {
          '0%, 100%': { opacity: '0.6', transform: 'scale(1)' },
          '50%': { opacity: '0.9', transform: 'scale(1.02)' },
        },
        'twinkle': {
          '0%, 100%': { opacity: '1', transform: 'scale(1)' },
          '50%': { opacity: '0.3', transform: 'scale(0.8)' },
        },
        'breathe': {
          '0%, 100%': { transform: 'scale(1)', opacity: '0.9' },
          '50%': { transform: 'scale(1.08)', opacity: '1' },
        },
        'breathe-shadow': {
          '0%, 100%': { transform: 'translateX(-50%) scale(1)', opacity: '0.15' },
          '50%': { transform: 'translateX(-50%) scale(1.1)', opacity: '0.25' },
        },
        'float': {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        'toast-in': {
          '0%': { opacity: '0', transform: 'translateY(-10px) scale(0.95)' },
          '100%': { opacity: '1', transform: 'translateY(0) scale(1)' },
        },
        'blink': {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0' },
        },
        'glow-pulse': {
          '0%, 100%': { opacity: '0.4', transform: 'scale(1)' },
          '50%': { opacity: '0.6', transform: 'scale(1.15)' },
        },
        'glow-pulse-delayed': {
          '0%, 100%': { opacity: '0.5', transform: 'scale(1.1)' },
          '50%': { opacity: '0.7', transform: 'scale(1.25)' },
        },
        'rotate-slow': {
          from: { transform: 'rotate(0deg)' },
          to: { transform: 'rotate(360deg)' },
        },
        'rotate-slow-reverse': {
          from: { transform: 'rotate(360deg)' },
          to: { transform: 'rotate(0deg)' },
        },
        'highlight-pulse': {
          '0%, 100%': { opacity: '0.6', transform: 'scale(1)' },
          '50%': { opacity: '0.8', transform: 'scale(1.1)' },
        },
        'shimmer': {
          from: { transform: 'rotate(0deg)' },
          to: { transform: 'rotate(360deg)' },
        },
        'particle': {
          '0%, 100%': { opacity: '0.3', transform: 'scale(0.8)' },
          '50%': { opacity: '0.8', transform: 'scale(1.2)' },
        },
      },
    },
  },
  plugins: [],
}
