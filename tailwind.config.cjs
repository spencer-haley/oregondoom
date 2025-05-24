module.exports = {
  content: [
    "./index.html",
    "./src/**/*.{js,jsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        doomGreen: '#9acd32',
        doomMoss: '#3a5f0b',
        doomGrey: '#E0E0E0',
        black: '#000000',
      },
      fontFamily: {
        sans: ['Montserrat', 'sans-serif'],
        metal: ['"Metal Mania"', 'cursive'],
      },
    },
  },
  plugins: [],
}
