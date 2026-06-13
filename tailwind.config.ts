import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        display: ["var(--font-display)", "Cormorant Garamond", "Georgia", "serif"],
        serif: ["var(--font-body)", "EB Garamond", "Georgia", "serif"],
      },
      colors: {
        paper: "#F6F2EA",
        card: "#FCFAF4",
        ink: "#211C16",
        muted: "#8C8275",
        line: "#E3DCCE",
        gold: "#A8884E",
        goldDark: "#8A6F3D",
      },
      letterSpacing: {
        label: "0.18em",
      },
    },
  },
  plugins: [],
};

export default config;
