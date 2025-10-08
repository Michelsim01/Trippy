/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          1: '#3B82F6',
          2: '#2563EB',
          3: '#1D4ED8',
        },
        neutrals: {
          1: '#1F2937',
          2: '#374151',
          3: '#6B7280',
          4: '#9CA3AF',
          5: '#D1D5DB',
          6: '#E5E7EB',
          7: '#F3F4F6',
          8: '#F9FAFB',
        },
        success: '#10B981',
        warning: '#F59E0B',
        error: '#EF4444',
      },
    },
  },
  plugins: [],
}
