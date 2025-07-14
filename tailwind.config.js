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
          'bg-primary': '#111827',
          'bg-secondary': '#1f2937',
          'bg-tertiary': '#374151',
          'text-primary': '#f9fafb',
          'text-secondary': '#e5e7eb',
          'border-primary': '#4b5563',
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
    function({ addBase, addComponents, theme }) {
      addComponents({
        '.dark .bg-white': {
          backgroundColor: '#1f2937 !important',
        },
        '.dark .border-gray-200': {
          borderColor: '#374151 !important',
        },
        '.dark .text-gray-900': {
          color: '#f9fafb !important',
        },
        '.dark .text-gray-700': {
          color: '#e5e7eb !important',
        },
        '.dark .text-gray-600': {
          color: '#d1d5db !important',
        },
        '.dark .bg-gray-50': {
          backgroundColor: '#374151 !important',
        },
        '.dark .bg-gray-100': {
          backgroundColor: '#374151 !important',
        },
        '.dark .bg-blue-50': {
          backgroundColor: '#1e3a8a !important',
        },
        '.dark .bg-green-50': {
          backgroundColor: '#064e3b !important',
        },
        '.dark .bg-yellow-50': {
          backgroundColor: '#78350f !important',
        },
        '.dark .bg-red-50': {
          backgroundColor: '#7f1d1d !important',
        },
        '.dark .bg-purple-50': {
          backgroundColor: '#4c1d95 !important',
        },
        '.dark .bg-indigo-50': {
          backgroundColor: '#312e81 !important',
        },
        '.dark .bg-pink-50': {
          backgroundColor: '#831843 !important',
        },
        '.dark .bg-orange-50': {
          backgroundColor: '#7c2d12 !important',
        },
        '.dark input, .dark select, .dark textarea': {
          backgroundColor: '#374151 !important',
          borderColor: '#4b5563 !important',
          color: '#f9fafb !important',
        },
        '.dark button': {
          color: '#f9fafb',
        },
        '.dark .rounded-lg, .dark .rounded-xl': {
          backgroundColor: '#1f2937 !important',
        },
        '.dark div[class*="bg-white"]': {
          backgroundColor: '#1f2937 !important',
        },
        '.dark div[class*="rounded"]': {
          backgroundColor: '#1f2937 !important',
        },
        '.dark *[class*="shadow"]': {
          backgroundColor: '#1f2937 !important',
        },
        '.dark *[class*="card"]': {
          backgroundColor: '#1f2937 !important',
        },
        '.dark *[class*="box"]': {
          backgroundColor: '#1f2937 !important',
        },
        '.dark *[class*="container"]': {
          backgroundColor: '#1f2937 !important',
        },
        '.dark *[class*="panel"]': {
          backgroundColor: '#1f2937 !important',
        },
        '.dark *[class*="modal"]': {
          backgroundColor: '#1f2937 !important',
        },
        '.dark *[class*="dropdown"]': {
          backgroundColor: '#1f2937 !important',
        },
        '.dark *[class*="popover"]': {
          backgroundColor: '#1f2937 !important',
        },
        '.dark *[class*="menu"]': {
          backgroundColor: '#1f2937 !important',
        },
        '.dark *[class*="tooltip"]': {
          backgroundColor: '#1f2937 !important',
        },
        '.dark *[class*="dialog"]': {
          backgroundColor: '#1f2937 !important',
        },
        '.dark *[class*="sidebar"]': {
          backgroundColor: '#1f2937 !important',
        },
        '.dark *[class*="header"]': {
          backgroundColor: '#1f2937 !important',
        },
        '.dark *[class*="footer"]': {
          backgroundColor: '#1f2937 !important',
        },
        '.dark *[class*="nav"]': {
          backgroundColor: '#1f2937 !important',
        },
        '.dark *[class*="tab"]': {
          backgroundColor: '#1f2937 !important',
        },
        '.dark *[class*="content"]': {
          backgroundColor: '#1f2937 !important',
        },
        '.dark *[class*="section"]': {
          backgroundColor: '#1f2937 !important',
        },
        '.dark *[class*="wrapper"]': {
          backgroundColor: '#1f2937 !important',
        },
        '.dark *[class*="form"]': {
          backgroundColor: '#1f2937 !important',
        },
        '.dark *[class*="input"]': {
          backgroundColor: '#374151 !important',
        },
        '.dark *[class*="select"]': {
          backgroundColor: '#374151 !important',
        },
        '.dark *[class*="textarea"]': {
          backgroundColor: '#374151 !important',
        },
        '.dark *[class*="button"]': {
          backgroundColor: '#374151 !important',
        },
        '.dark *[class*="btn"]': {
          backgroundColor: '#374151 !important',
        },
        '.dark *[class*="card"]': {
          backgroundColor: '#1f2937 !important',
        },
        '.dark *[class*="table"]': {
          backgroundColor: '#1f2937 !important',
        },
        '.dark *[class*="tr"]': {
          backgroundColor: '#1f2937 !important',
        },
        '.dark *[class*="td"]': {
          backgroundColor: '#1f2937 !important',
        },
        '.dark *[class*="th"]': {
          backgroundColor: '#1f2937 !important',
        },
        '.dark *[class*="list"]': {
          backgroundColor: '#1f2937 !important',
        },
        '.dark *[class*="item"]': {
          backgroundColor: '#1f2937 !important',
        },
        '.dark *[class*="group"]': {
          backgroundColor: '#1f2937 !important',
        },
        '.dark *[class*="grid"]': {
          backgroundColor: '#1f2937 !important',
        },
        '.dark *[class*="flex"]': {
          backgroundColor: '#1f2937 !important',
        },
        '.dark *[class*="col"]': {
          backgroundColor: '#1f2937 !important',
        },
        '.dark *[class*="row"]': {
          backgroundColor: '#1f2937 !important',
        },
        '.dark *[class*="container"]': {
          backgroundColor: '#1f2937 !important',
        },
        '.dark *[class*="wrapper"]': {
          backgroundColor: '#1f2937 !important',
        },
        '.dark *[class*="panel"]': {
          backgroundColor: '#1f2937 !important',
        },
        '.dark *[class*="modal"]': {
          backgroundColor: '#1f2937 !important',
        },
        '.dark *[class*="dialog"]': {
          backgroundColor: '#1f2937 !important',
        },
        '.dark *[class*="popover"]': {
          backgroundColor: '#1f2937 !important',
        },
        '.dark *[class*="menu"]': {
          backgroundColor: '#1f2937 !important',
        },
        '.dark *[class*="dropdown"]': {
          backgroundColor: '#1f2937 !important',
        },
        '.dark *[class*="tooltip"]': {
          backgroundColor: '#1f2937 !important',
        },
        '.dark *[class*="sidebar"]': {
          backgroundColor: '#1f2937 !important',
        },
        '.dark *[class*="header"]': {
          backgroundColor: '#1f2937 !important',
        },
        '.dark *[class*="footer"]': {
          backgroundColor: '#1f2937 !important',
        },
        '.dark *[class*="nav"]': {
          backgroundColor: '#1f2937 !important',
        },
        '.dark *[class*="tab"]': {
          backgroundColor: '#1f2937 !important',
        },
        '.dark *[class*="content"]': {
          backgroundColor: '#1f2937 !important',
        },
        '.dark *[class*="section"]': {
          backgroundColor: '#1f2937 !important',
        },
        '.dark *[class*="wrapper"]': {
          backgroundColor: '#1f2937 !important',
        },
        '.dark *[class*="form"]': {
          backgroundColor: '#1f2937 !important',
        },
      });
    }
  ],
};