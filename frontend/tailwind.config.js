/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        'dm-sans': ['DM Sans', 'sans-serif'],
        'poppins': ['Poppins', 'sans-serif'],
      },
      colors: {
        primary: {
          1: '#4AC63F',
          2: '#F6C92D',
          3: '#FD7FE9',
          4: '#62B3FD',
        },
        neutrals: {
          1: '#141416',
          2: '#23262F',
          3: '#353945',
          4: '#777E90',
          5: '#B1B5C3',
          6: '#E6E8EC',
          7: '#F4F5F6',
          8: '#FCFCFD',
        }
      }
    },
  },
  plugins: [],
}

