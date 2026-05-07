/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: "class",
  content: ["./app/**/*.{js,jsx,ts,tsx}", "./components/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        background: "#0b1322",
        foreground: "#f4f7fb",
        card: "#152138",
        "card-foreground": "#f4f7fb",
        popover: "#0e1828",
        "popover-foreground": "#f4f7fb",
        primary: "#7c95ff",
        "primary-foreground": "#0b1322",
        secondary: "#f1d9b1",
        "secondary-foreground": "#0b1322",
        cream: "#f0d8b9",
        muted: "rgba(216,227,244,0.1)",
        "muted-foreground": "rgba(244,247,251,0.6)",
        accent: "#ec8f64",
        "accent-foreground": "#0b1322",
        destructive: "#ec8f64",
        border: "rgba(216,227,244,0.18)",
        input: "rgba(216,227,244,0.16)",
        ring: "#7c95ff",
      },
      fontFamily: {
        // iOS ships "New York" natively (Apple's modern transitional serif).
        // Falls back to Charter / Georgia on Android. No asset loading required.
        display: ['"New York"', "Charter", "Georgia", "serif"],
        serif: ['"New York"', "Charter", "Georgia", "serif"],
      },
      borderRadius: {
        sm: "0.375rem",
        md: "0.5rem",
        lg: "0.625rem",
        xl: "0.75rem",
      },
    },
  },
  plugins: [],
};
