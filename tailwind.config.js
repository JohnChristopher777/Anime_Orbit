/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                primary: '#ffd700',
                secondary: '#1a1a1a',
                accent: '#27ae60',
            },
            fontFamily: {
                bungee: ['Bungee', 'cursive'],
                staatliches: ['Staatliches', 'cursive'],
                bebas: ['Bebas Neue', 'cursive'],
                montserrat: ['Montserrat', 'sans-serif'],
                inter: ['Inter', 'sans-serif'],
                noto: ['Noto Sans JP', 'sans-serif'],
            },
        },
    },
    plugins: [],
}
