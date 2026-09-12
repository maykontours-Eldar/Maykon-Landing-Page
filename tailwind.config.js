/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./*.html", "./js/**/*.js"],
  theme: {
    extend: {
      colors: {
        navy: {
          950: "#050f1a",
          900: "#071b2c",
          800: "#0b2540",
          700: "#123655",
          600: "#1a4569",
          500: "#245577",
        },
        turquoise: {
          600: "#1FA79D",
          500: "#2FC9C0",
          400: "#5DDCD3",
          300: "#8FE8E1",
          100: "#DFF9F6",
        },
        coral: {
          700: "#D95A26",
          600: "#F26B2E",
          500: "#FA8B3C",
          400: "#FCA766",
          300: "#FDC594",
        },
        cream: {
          500: "#E8D9B5",
          300: "#F2E8D3",
          100: "#FBF6EA",
          50: "#FEFCF6",
        },
        gold: {
          600: "#B4863F",
          500: "#D8B26B",
          400: "#E5C88C",
        },
        burgundy: {
          700: "#5A1A2A",
          600: "#6C1F33",
        },
      },
      fontFamily: {
        sans: ["Rubik", "Heebo", "system-ui", "sans-serif"],
        display: ["Rubik", "Heebo", "system-ui", "sans-serif"],
      },
      boxShadow: {
        soft: "0 10px 40px -10px rgba(7,27,44,0.35)",
        glow: "0 0 0 1px rgba(216,178,107,0.25), 0 8px 30px -8px rgba(250,139,60,0.45)",
        card: "0 4px 20px -4px rgba(7,27,44,0.15)",
      },
      backgroundImage: {
        "navy-gradient": "linear-gradient(160deg, #071b2c 0%, #0b2540 45%, #123655 100%)",
        "coral-gradient": "linear-gradient(135deg, #FA8B3C 0%, #F26B2E 100%)",
        "turquoise-gradient": "linear-gradient(135deg, #2FC9C0 0%, #1FA79D 100%)",
      },
      animation: {
        "fade-in": "fadeIn 1s ease forwards",
        "float": "float 6s ease-in-out infinite",
        "pulse-soft": "pulseSoft 2.4s ease-in-out infinite",
      },
      keyframes: {
        fadeIn: {
          "0%": { opacity: 0, transform: "translateY(16px)" },
          "100%": { opacity: 1, transform: "translateY(0)" },
        },
        float: {
          "0%, 100%": { transform: "translateY(0px)" },
          "50%": { transform: "translateY(-10px)" },
        },
        pulseSoft: {
          "0%, 100%": { transform: "scale(1)", opacity: 1 },
          "50%": { transform: "scale(1.08)", opacity: 0.85 },
        },
      },
    },
  },
  plugins: [],
};
