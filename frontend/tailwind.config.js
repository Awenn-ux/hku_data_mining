/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // HKU 品牌色
        hku: {
          green: {
            light: '#2E7D32',
            DEFAULT: '#1B5E20',
            dark: '#0D3A15',
          },
          gold: {
            light: '#D4AF37',
            DEFAULT: '#B8860B',
            dark: '#8B7355',
          },
          blue: {
            light: '#03A9F4',
            DEFAULT: '#0288D1',
            dark: '#01579B',
          },
        },
        // 扩展调色板
        primary: '#1B5E20',
        secondary: '#B8860B',
        accent: '#0288D1',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        serif: ['Merriweather', 'Georgia', 'serif'],
      },
      backgroundImage: {
        'gradient-hku': 'linear-gradient(135deg, #1B5E20 0%, #2E7D32 100%)',
        'gradient-gold': 'linear-gradient(135deg, #B8860B 0%, #D4AF37 100%)',
      },
      boxShadow: {
        'hku': '0 4px 14px 0 rgba(27, 94, 32, 0.15)',
        'gold': '0 4px 14px 0 rgba(184, 134, 11, 0.15)',
      },
      animation: {
        'fade-in': 'fadeIn 0.5s ease-in-out',
        'slide-up': 'slideUp 0.3s ease-out',
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
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
      },
    },
  },
  plugins: [],
};

