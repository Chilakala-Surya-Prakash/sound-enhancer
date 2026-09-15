/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Plus Jakarta Sans', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
        serif: ['Newsreader', 'Georgia', 'serif'],
      },
      colors: {

        studio: {
          900: '#0b0f19',
          800: '#111827',
          700: '#1f2937',
          600: '#374151',
          accent: '#06b6d4',
          violet: '#8b5cf6',
          amber: '#f59e0b',
          rose: '#f43f5e',
          emerald: '#10b981'
        }
      },
      animation: {
        'pulse-subtle': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      }
    },
  },
  plugins: [],
}
