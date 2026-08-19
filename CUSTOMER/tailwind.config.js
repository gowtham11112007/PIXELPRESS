/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Fredoka', 'sans-serif'],
      },
      colors: {
        brand: {
          50: '#f9fafb',
          100: '#f3f4f6',
          500: '#333333',
          600: '#121212', // Primary dark foreground from Posterized
          900: '#000000',
        }
      }
    },
  },
  plugins: [],
}
