/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        base: '#0A0A0B',
        surface: {
          DEFAULT: '#141416',
          2: '#1C1C1F',
        },
        border: '#2A2A2E',
        text: {
          DEFAULT: '#EDEDED',
          muted: '#9A9AA0',
        },
        accent: '#B6FF3C',
      },
      fontFamily: {
        display: ['"Space Grotesk"', 'system-ui', 'sans-serif'],
        body: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['"IBM Plex Mono"', 'monospace'],
      },
      letterSpacing: {
        display: '-0.02em',
      },
    },
  },
  plugins: [],
}
