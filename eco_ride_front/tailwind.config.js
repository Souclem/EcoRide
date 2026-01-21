/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{vue,js,ts}"
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#f0fdf4',
          100: '#dcfce7',
          500: '#2ecc71',  // ecoGreen
          600: '#16a34a',
          700: '#15803d',
        },
        ecoGreen: "#2ecc71",  // Compatibilité
      },
    },
  },
  plugins: [
    function({ addComponents }) {
      addComponents({
        // BOUTONS
        '.btn': {
          '@apply inline-flex items-center justify-center font-semibold rounded-xl transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2': {},
        },
        '.btn-primary': {
          '@apply btn bg-gradient-to-r from-primary-500 to-primary-600 text-white shadow-lg hover:shadow-xl hover:-translate-y-1 focus:ring-primary-500': {},
        },
        '.btn-secondary': {
          '@apply btn bg-white border-2 border-primary-500 text-primary-600 hover:bg-primary-500 hover:text-white focus:ring-primary-500': {},
        },
        '.btn-danger': {
          '@apply btn bg-gradient-to-r from-red-500 to-red-600 text-white shadow-lg hover:shadow-xl hover:-translate-y-1 focus:ring-red-500': {},
        },
        '.btn-sm': {
          '@apply px-4 py-2 text-sm': {},
        },
        '.btn-md': {
          '@apply px-6 py-3 text-base': {},
        },
        '.btn-lg': {
          '@apply px-8 py-4 text-lg': {},
        },

        // CARTES
        '.card': {
          '@apply bg-white rounded-2xl shadow-xl overflow-hidden': {},
        },
        '.card-hover': {
          '@apply card hover:shadow-2xl transition-shadow duration-200': {},
        },
        '.card-body': {
          '@apply p-6 md:p-8': {},
        },
        '.card-header': {
          '@apply bg-gradient-to-r from-purple-500 to-blue-500 p-6 text-white': {},
        },

        // INPUTS
        '.input-field': {
          '@apply w-full px-4 py-2 border border-gray-300 rounded-lg transition-all focus:ring-2 focus:outline-none focus:ring-primary-500 focus:border-primary-500': {},
        },
        '.input-error': {
          '@apply input-field border-red-500 focus:ring-red-500': {},
        },

        // BADGES
        '.badge': {
          '@apply inline-flex items-center px-3 py-1 rounded-lg text-sm font-semibold': {},
        },
        '.badge-success': {
          '@apply badge bg-green-100 text-green-800': {},
        },
        '.badge-warning': {
          '@apply badge bg-yellow-100 text-yellow-800': {},
        },
        '.badge-danger': {
          '@apply badge bg-red-100 text-red-800': {},
        },
        '.badge-info': {
          '@apply badge bg-blue-100 text-blue-800': {},
        },
      })
    }
  ],
}
