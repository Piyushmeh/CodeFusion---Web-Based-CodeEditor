/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        dark: {
          DEFAULT: '#0b0b0f',
          card: '#18181b',
          border: '#27272a',
        },
        neon: {
          purple: '#7c3aed',
          glow: '#a855f7',
        },
      },
      boxShadow: {
        neon: '0 0 20px rgba(124, 58, 237, 0.4)',
        'neon-sm': '0 0 10px rgba(124, 58, 237, 0.3)',
      },
      animation: {
        glow: 'glow 3s ease-in-out infinite alternate',
      },
      keyframes: {
        glow: {
          '0%': { boxShadow: '0 0 15px rgba(124, 58, 237, 0.3)' },
          '100%': { boxShadow: '0 0 25px rgba(168, 85, 247, 0.5)' },
        },
      },
    },
  },
  plugins: [],
};
