/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        charcoal: '#1A1A1A',
        accent: '#F47A20',
        'card-bg': '#FFFFFF',
        secondary: '#2A2A2A',
        'text-light': '#FFFFFF',
        'text-dark': '#1A1A1A',
        muted: '#9CA3AF',
        // Event type colors
        'job-occupied': '#3B82F6',
        'job-occupied-border': '#2563EB',
        'job-vacant': '#14B8A6',
        'job-vacant-border': '#0D9488',
        'callback-job': '#F59E0B',
        'callback-job-border': '#D97706',
        'sales-stop': '#8B5CF6',
        'sales-stop-border': '#7C3AED',
        meeting: '#64748B',
        'meeting-border': '#475569',
        'time-off': '#F43F5E',
        'time-off-border': '#E11D48',
        // Job status indicators
        'status-closed-no-invoice': '#EAB308',
        'status-closed-invoiced': '#8B5CF6',
      },
      fontFamily: {
        heading: ['"Bebas Neue"', 'sans-serif'],
        body: ['"Open Sans"', 'sans-serif'],
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0', transform: 'translateY(10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
      animation: {
        fadeIn: 'fadeIn 0.2s ease-out',
      },
    },
  },
  plugins: [],
}

