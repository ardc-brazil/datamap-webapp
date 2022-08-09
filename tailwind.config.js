/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    fontFamily: {
      sans: ["Inter", "system-ui", "sans-serif"],
      display: ["Inter", "system-ui", "sans-serif"],
      body: ["Inter", "system-ui", "sans-serif"],
    },
    colors: {
      // See the primary pallet colors: https://coolors.co/gradient-palette/f9fafb-111827?number=10
      primary: {
        50: "#f9fafb",
        100: "#f3f4f6",
        200: "#e5e7eb",
        300: "#d1d5db",
        400: "#9ca3af",
        500: "#6b7280",
        600: "#4b5563",
        700: "#374151",
        800: "#1f2937",
        900: "#111827",
      },
      secondary: {
        // See the secondary pallet color: https://coolors.co/gradient-palette/fbfcfc-d7e4e3?number=10
        50: "#FBFCFC",
        100: "#FBFCFC",
        200: "#F6F9F9",
        300: "#F2F6F6",
        400: "#EDF3F3",
        500: "#E9F0EF",
        600: "#E4EDEC",
        700: "#E0EAE9",
        800: "#DBE7E6",
        900: "#D7E4E3",
      },
    },
  },
  plugins: [],
};
