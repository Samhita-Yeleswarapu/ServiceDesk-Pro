/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        // Executive navy / steel palette (replaces the default indigo-blue)
        brand: {
          50: "#f4f6f9",
          100: "#e6ebf1",
          200: "#ccd6e2",
          300: "#a3b5ca",
          400: "#718aa7",
          500: "#3b5878",
          600: "#24405f",
          700: "#1a3150",
          800: "#122440",
          900: "#0b1a2f",
          950: "#071120",
        },
        // Muted brass / gold accent (replaces the bright teal)
        teal: {
          50: "#fbf7ef",
          100: "#f5ecd8",
          200: "#ead7ae",
          300: "#dcbc7c",
          400: "#cca55b",
          500: "#b48a3c",
          600: "#98722c",
          700: "#785a24",
        },
        coral: {
          400: "#c98a5a",
          500: "#b06a36",
        },
      },
      fontFamily: {
        display: ["Poppins", "sans-serif"],
        body: ["Inter", "sans-serif"],
      },
      boxShadow: {
        soft: "0 6px 20px -6px rgba(11, 26, 47, 0.35)",
        card: "0 1px 3px rgba(11, 26, 47, 0.06), 0 4px 14px rgba(11, 26, 47, 0.04)",
      },
      borderRadius: {
        xl2: "1rem",
      },
      animation: {
        "fade-in": "fadeIn 0.4s ease-in-out",
        "slide-up": "slideUp 0.35s ease-out",
      },
      keyframes: {
        fadeIn: { "0%": { opacity: 0 }, "100%": { opacity: 1 } },
        slideUp: {
          "0%": { opacity: 0, transform: "translateY(10px)" },
          "100%": { opacity: 1, transform: "translateY(0)" },
        },
      },
    },
  },
  plugins: [],
};
