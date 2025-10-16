// tailwind.config.ts
import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      // ADD/UPDATE THIS SECTION
      colors: {
        'pastel-beige': '#fefae0',
        'primary-blue': '#2564EB',
      },
      keyframes: {
        'scan-beam': {
          '0%': { transform: 'translateY(0%)' },
          '100%': { transform: 'translateY(100%)' },
        },
      },
      animation: {
        'scan-beam': 'scan-beam 3s ease-in-out infinite alternate',
      },
    },
  },
  plugins: [],
};

export default config;