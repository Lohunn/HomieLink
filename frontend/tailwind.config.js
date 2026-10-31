/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        'bg-main': '#101116',
        'bg-sidebar': '#191B24',
        'bg-surface': '#222531',
        'bg-hover': '#2B2E3C',
        'border-subtle': '#303341',
        'text-primary': '#F4F4F7',
        'text-secondary': '#9295A5',
        'text-muted': '#686C7D',
        'status-online': '#22C55E',
        'status-away': '#FBBF24',
        'status-error': '#F87171',
        brand: {
          primary: '#8B5CF6',
          hover: '#7C3AED',
          secondary: '#38BDF8',
          50: '#f5f3ff',
          100: '#ede9fe',
          200: '#ddd6fe',
          300: '#c4b5fd',
          400: '#a78bfa',
          500: '#8B5CF6',
          600: '#7C3AED',
          700: '#6d28d9',
          800: '#5b21b6',
          900: '#4c1d95',
          DEFAULT: '#8B5CF6',
        },
      },
      borderRadius: {
        'sm': '8px',
        'md': '12px',
        'lg': '16px',
        'bubble': '16px',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
