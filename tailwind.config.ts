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
        // 자연 친화 팔레트 (숲/이끼/새싹)
        forest: {
          900: "#07160f",
          800: "#0b1d13",
          700: "#0f2a1c",
          600: "#123722",
          500: "#1a4a30",
          400: "#2f7a4f",
        },
        leaf: "#3fae6b",
        mint: "#86e5c8",
        sage: "#cfe3d2",
      },
      fontFamily: {
        sans: ["Pretendard", "Pretendard Variable", "system-ui", "sans-serif"],
      },
      boxShadow: {
        card: "0 1px 2px rgba(16,24,40,.04), 0 1px 3px rgba(16,24,40,.06)",
        pop: "0 10px 40px rgba(3,20,12,.45)",
      },
    },
  },
  plugins: [],
};
export default config;
