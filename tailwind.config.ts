import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        bg: "#0b0d10",
        card: "#15191e",
        ink: "#f1f2f3",
        mute: "#9299a2",
        ember: "#f07824",
        gold: "#ff9a3d",
        ok: "#69b58a",
        line: "#30363d",
        danger: "#e06458",
        on: "#101215",
      },
      boxShadow: {
        card: "0 10px 28px rgba(0,0,0,.22), inset 0 1px 0 rgba(255,255,255,.025)",
        ember: "0 5px 16px rgba(240,120,36,.16)",
      },
    },
  },
  plugins: [],
};

export default config;
