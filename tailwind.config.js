/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}'
  ],
  theme: {
    extend: {
      colors: {
        dark: {
          'bg-primary': '#111827',       // Main background
          'bg-secondary': '#1f2937',     // Card background
          'bg-tertiary': '#374151',      // Input/select background
          'text-primary': '#f9fafb',     // Headings
          'text-secondary': '#e5e7eb',   // Descriptions
          'border-primary': '#4b5563',   // Border for inputs, cards
        }
      },
      animation: {
        'fade-in': 'fadeIn 0.3s ease-in-out',
        'slide-in': 'slideIn 0.3s ease-in-out',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: 0, transform: 'translateY(-10px)' },
          '100%': { opacity: 1, transform: 'translateY(0)' },
        },
        slideIn: {
          '0%': { opacity: 0, transform: 'translateX(20px)' },
          '100%': { opacity: 1, transform: 'translateX(0)' },
        },
      },
    },
  },
  plugins: [
    function ({ addBase }) {
      addBase({
        // Backgrounds
        '.dark .bg-white': { backgroundColor: '#1f2937 !important' },
        '.dark .bg-gray-50': { backgroundColor: '#1f2937 !important' },
        '.dark .bg-gray-100': { backgroundColor: '#1f2937 !important' },

        // Texts
        '.dark .text-gray-900': { color: '#f9fafb !important' },
        '.dark .text-gray-700': { color: '#e5e7eb !important' },
        '.dark .text-gray-600': { color: '#d1d5db !important' },

        // Borders
        '.dark .border-gray-200': { borderColor: '#4b5563 !important' },

        // Inputs and Buttons
        '.dark input, .dark textarea, .dark select': {
          backgroundColor: '#374151 !important',
          borderColor: '#4b5563 !important',
          color: '#f9fafb !important',
        },
        '.dark button': { color: '#f9fafb !important' },

        // Utility containers
        '.dark .rounded-lg, .dark .rounded-xl': {
          backgroundColor: '#1f2937 !important',
        },
        '.dark .shadow-sm, .dark .shadow-md, .dark .shadow-lg': {
          backgroundColor: '#1f2937 !important',
        },
      });
    }
  ],
};
