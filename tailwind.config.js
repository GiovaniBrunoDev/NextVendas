/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      animation: {
        fadeIn: 'fadeIn 0.3s ease-out',
        spinIn: 'spinIn 0.4s ease-out',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: 0, transform: 'scale(0.95)' },
          '100%': { opacity: 1, transform: 'scale(1)' },
        },
        spinIn: {
          '0%': {
            opacity: 0,
            transform: 'rotate(-20deg) scale(0.9)',
          },
          '100%': {
            opacity: 1,
            transform: 'rotate(0deg) scale(1)',
          },
        },
      },
    },
  },
  plugins: [],
}