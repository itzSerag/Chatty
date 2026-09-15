import daisyui from 'daisyui';
import { THEMES } from './src/constants/index'
 /** @type {import('tailwindcss').Config} */
 export default {
  content: ["./src/**/*.{html,js,jsx,tsx,ts}"],
  theme: {
    extend: {},
  },
  plugins: [daisyui],
  daisyui : {
    themes: THEMES
    
  }
}