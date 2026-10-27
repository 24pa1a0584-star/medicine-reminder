/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        brand: {
          emerald: '#10B981',
          emeraldDark: '#059669',
          indigo: '#6366F1',
          indigoDark: '#4F46E5',
          coral: '#F59E8B',
          lavender: '#9B8AFB',
          mint: '#B7F7E4',
          sky: '#89D7F7',
          navy: '#162238',
          cloud: '#F8FAFC',
        },
        slate: {
          850: '#1e293b',
          900: '#0f172a',
          950: '#020617',
        },
      },
      fontFamily: {
        heading: ['"Space Grotesk"', 'sans-serif'],
        sans: ['"Plus Jakarta Sans"', 'sans-serif'],
      },
      boxShadow: {
        bloom: '0 10px 30px -10px rgba(16, 185, 129, 0.25)',
        'bloom-indigo': '0 10px 30px -10px rgba(99, 102, 241, 0.25)',
        glass: '0 8px 32px 0 rgba(31, 38, 135, 0.08)',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        pulseSlow: {
          '0%, 100%': { opacity: '1', transform: 'scale(1)' },
          '50%': { opacity: '0.85', transform: 'scale(1.03)' },
        },
      },
      animation: {
        float: 'float 4s ease-in-out infinite',
        'pulse-slow': 'pulseSlow 3s ease-in-out infinite',
      },
    },
  },
  plugins: [],
};
