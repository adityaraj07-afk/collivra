/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        bg: '#F4F9F6',
        bgHero: '#DCF0E4',
        surface: '#FFFFFF',
        surface2: '#EBF5EF',
        border: '#DCE9E1',
        borderStrong: '#B7D4C3',
        primary: '#2D6A4F',
        primaryHover: '#40916C',
        accent: '#2E9E63',
        accentLight: '#52B788',
        info: '#2F7EC4',
        warning: '#D98A0B',
        danger: '#D94F4F',
        text: '#1B4332',
        textSecondary: '#40584C',
        muted: '#7A9287',
        sidebarBg: '#14432F',
        sidebarHover: '#1B5740',
        sidebarActive: '#2D6A4F',
        sidebarText: '#B7E4C7',
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      },
      spacing: {
        '18': '4.5rem',
      },
      maxWidth: {
        content: '1200px',
      },
    },
  },
  plugins: [],
}
