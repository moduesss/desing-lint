/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./ui/**/*.{ts,tsx,html}'],
  theme: {
    extend: {
      fontSize: {
        xs: ['12px', '18px'],
        sm: ['13px', '20px'],
      },
      boxShadow: {
        card: '0 1px 2px rgba(0,0,0,.06), 0 4px 10px rgba(0,0,0,.04)',
      },
      colors: {
        brand: {
          50:  '#eef2ff',
          100: '#e0e7ff',
          500: '#6366f1',
          600: '#5457ee',
        },
      },
      borderRadius: {
        xl: '12px',
        '2xl': '16px',
      },
    },
  },
  plugins: [],
}
