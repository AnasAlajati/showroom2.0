/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          dark:       '#1a1a1a',
          terracotta: '#B5614A',
          indigo:     '#2E3A52',
          mauve:      '#C4A49A',
          cream:      '#EDE0C8',
          gold:       '#C5A059',
        },
      },
      fontFamily: {
        serif: ['"Playfair Display"', 'Georgia', 'serif'],
        sans:  ['Lato', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
