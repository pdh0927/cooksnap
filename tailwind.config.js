/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./app/**/*.{js,jsx,ts,tsx}", "./src/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        bg: "#FAFAF9",
        surface: "#FFFFFF",
        border: "#E7E5E4",
        "text-primary": "#1C1917",
        "text-secondary": "#78716C",
        "text-tertiary": "#A8A29E",
        accent: "#F97316",
        "accent-light": "#FFF7ED",
        "accent-dark": "#EA580C",
        success: "#22C55E",
        danger: "#EF4444",
      },
      fontFamily: {
        sans: ["System"],
      },
    },
  },
  plugins: [],
};
