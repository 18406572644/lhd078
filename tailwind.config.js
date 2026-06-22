export default {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{js,ts,vue}"],
  theme: {
    container: { center: true },
    extend: {
      colors: {
        warm: {
          orange: '#E8763A',
          bg: '#FDF6EC',
          brown: '#B8956A',
          dark: '#5C3D2E',
          yellow: '#FFF3D6',
          green: '#7CB342',
        },
      },
      fontFamily: {
        title: ['ZCOOL XiaoWei', 'serif'],
        body: ['Noto Sans SC', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
