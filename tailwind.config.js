import typography from '@tailwindcss/typography';

/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}",
    "./context/**/*.{js,ts,jsx,tsx}",
    "./services/**/*.{js,ts,jsx,tsx}"
  ],
  theme: {
    extend: {
      colors: {
        ide: {
          bg: '#1e1e1e',
          panel: '#252526',
          accent: '#007acc',
          border: '#333333',
          fg: '#cccccc'
        }
      }
    },
  },
  plugins: [
    typography,
  ],
}