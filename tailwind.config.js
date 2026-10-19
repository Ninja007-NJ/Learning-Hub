/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        sky: { 50: '#F5F9FF', 100: '#E8F0FE' },
        brand: { DEFAULT: '#080808', dark: '#292929', light: '#EFEFEC' },
        ink: { DEFAULT: '#1B2433', soft: '#5B6577' },
        line: '#D4D4D0',
        night: { 900: '#F2F2EF', 800: '#FFFFFF', 700: '#EBEBE8' },
        mist: '#111111',
        fog: '#555550',
        glow: '#111111',
        frost: '#FFFFFF',
        lite: { covered: '#34D399', partial: '#FBBF24', review: '#A78BFA', missing: '#AAB5C5' },
        status: {
          covered: '#1E9E6A', partial: '#D98A00', missing: '#8A94A6',
          review: '#7C5CFA', danger: '#D64545',
        },
      },
      fontFamily: { sans: ['DM Sans', 'Arial', 'Helvetica Neue', 'system-ui', 'sans-serif'] },
      borderRadius: { btn: '12px', card: '16px' },
      boxShadow: {
        card: '0 2px 0 rgba(0,0,0,0.06)',
        raise: '0 1px 0 rgba(0,0,0,0.08)',
        lift: '0 3px 0 rgba(0,0,0,0.1)',
        blue: 'none',
      },
    },
  },
  plugins: [],
}
