import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        ink: "#1F2328",
        amber: { DEFAULT: "#E39A00", soft: "#FBF3DE" },
        teal: { DEFAULT: "#0A9AA8", soft: "#E1F5F7" },
        danger: { DEFAULT: "#D8432B", soft: "#FBE7E1" },
        ok: { DEFAULT: "#12A150", soft: "#E3F5EA" },
      },
      fontFamily: {
        sans: ["Pretendard", "Pretendard Variable", "system-ui", "sans-serif"],
      },
      boxShadow: {
        card: "0 1px 2px rgba(16,24,40,.04), 0 1px 3px rgba(16,24,40,.06)",
        pop: "0 8px 30px rgba(16,24,40,.12)",
      },
    },
  },
  plugins: [],
};
export default config;
