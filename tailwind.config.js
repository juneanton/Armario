/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        bg: '#F4F1EA',
        ink: '#111111',
        accent: '#2563EB',
        'accent-hover': '#1D4ED8',
        card: '#FAF8F5',
        muted: '#71717A',
        line: '#D4D4D8'
      },
      fontFamily: {
        condensed: ['"Barlow Condensed"', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'monospace'],
        sans: ['Inter', 'sans-serif']
      }
    },
  },
  plugins: [],
}
