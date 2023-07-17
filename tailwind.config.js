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
      transparent: "transparent",

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
       error: {
        50: "#FFADADff",
        100: "#FF9A9Aff",
        200: "#FF8787ff",
        300: "#FF7373ff",
        400: "#FF6060ff",
        500: "#FF4D4Dff",
        600: "#FF3A3Aff",
        700: "#FF2626ff",
        800: "#FF1313ff",
        900: "#FF0000ff",
       }
    },
    extend: {
      typography: (theme) => ({
        DEFAULT: {
          css: {
            color: theme("colors.gray.800"),
            h1: {
              color: theme("colors.primary.600"),
              fontWeight: "500",
              fontSize: 10
            },
            h2: {
              color: theme("colors.primary.600"),
            },
            h3: {
              color: theme("colors.primary.600"),
            },
            a: {
              color: theme("colors.primary.500"),
              fontWeight: "600",
              textDecoration: "underline",
            },
          },
        },
      }),
    },
  },
  plugins: [
    require("@tailwindcss/forms")({
      strategy: "class", // only generate classes
    }),
    require("@tailwindcss/typography"),
  ],
};
