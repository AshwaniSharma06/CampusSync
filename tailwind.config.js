/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        "on-error": "#690005",
        "surface-tint": "#71d8c8",
        "secondary-container": "#1738bd",
        "outline-variant": "#3d4947",
        "surface-container-high": "#1c2a42",
        "inverse-primary": "#006a60",
        "on-secondary": "#00208e",
        "on-surface-variant": "#bdc9c6",
        "on-primary-fixed-variant": "#005048",
        "primary": "#71d8c8",
        "on-secondary-fixed": "#00115a",
        "surface-container-low": "#0d1b33",
        "outline": "#879390",
        "error-container": "#93000a",
        "surface": "#04132a",
        "on-secondary-container": "#a7b4ff",
        "secondary-fixed": "#dee0ff",
        "tertiary-container": "#af8f4a",
        "inverse-on-surface": "#233149",
        "on-secondary-fixed-variant": "#1335bb",
        "secondary-fixed-dim": "#bac3ff",
        "primary-fixed-dim": "#71d8c8",
        "surface-container": "#112037",
        "on-tertiary": "#402d00",
        "surface-container-lowest": "#010e25",
        "on-background": "#d7e3ff",
        "tertiary-fixed": "#ffdf9f",
        "on-tertiary-fixed-variant": "#5b4301",
        "on-tertiary-fixed": "#261a00",
        "on-primary": "#003731",
        "error": "#ffb4ab",
        "on-primary-container": "#00322d",
        "on-error-container": "#ffdad6",
        "tertiary-fixed-dim": "#e6c277",
        "tertiary": "#e6c277",
        "on-tertiary-container": "#3a2900",
        "on-primary-fixed": "#00201c",
        "secondary": "#bac3ff",
        "background": "#04132a",
        "surface-variant": "#27354d",
        "primary-container": "#36a395",
        "on-surface": "#d7e3ff",
        "surface-dim": "#04132a",
        "surface-bright": "#2c3952",
        "inverse-surface": "#d7e3ff",
        "primary-fixed": "#8ef4e4",
        "surface-container-highest": "#27354d"
      },
      borderRadius: {
        "DEFAULT": "0.25rem",
        "lg": "0.5rem",
        "xl": "0.75rem",
        "full": "9999px"
      },
      spacing: {
        "margin-mobile": "20px",
        "section-gap": "128px",
        "margin-desktop": "64px",
        "gutter": "32px",
        "unit": "8px",
        "container-max": "1440px"
      },
      fontFamily: {
        serif: ['"Instrument Serif"', "Georgia", "serif"],
        display: ['"Instrument Serif"', "Georgia", "serif"],
        headline: ['"Instrument Serif"', "Georgia", "serif"],
        sans: ['"Plus Jakarta Sans"', '"Manrope"', "sans-serif"],
        body: ['"Plus Jakarta Sans"', '"Manrope"', "sans-serif"],
        label: ['"Outfit"', '"Plus Jakarta Sans"', "sans-serif"],
        // Legacy class aliases from Stitch
        "display-lg": ['"Instrument Serif"', "Georgia", "serif"],
        "display-md": ['"Instrument Serif"', "Georgia", "serif"],
        "headline-lg": ['"Instrument Serif"', "Georgia", "serif"],
        "headline-md": ['"Instrument Serif"', "Georgia", "serif"],
        "headline-lg-mobile": ['"Instrument Serif"', "Georgia", "serif"],
        "body-lg": ['"Plus Jakarta Sans"', '"Manrope"', "sans-serif"],
        "body-md": ['"Plus Jakarta Sans"', '"Manrope"', "sans-serif"],
        "label-sm": ['"Outfit"', '"Plus Jakarta Sans"', "sans-serif"]
      },
      fontSize: {
        "body-lg": ["20px", { "lineHeight": "32px", "fontWeight": "400" }],
        "headline-md": ["32px", { "lineHeight": "40px", "fontWeight": "400" }],
        "headline-lg": ["48px", { "lineHeight": "56px", "fontWeight": "400" }],
        "display-lg": ["84px", { "lineHeight": "92px", "letterSpacing": "-0.02em", "fontWeight": "400" }],
        "label-sm": ["12px", { "lineHeight": "16px", "letterSpacing": "0.08em", "fontWeight": "600" }],
        "headline-lg-mobile": ["36px", { "lineHeight": "44px", "fontWeight": "400" }],
        "display-md": ["64px", { "lineHeight": "72px", "letterSpacing": "-0.01em", "fontWeight": "400" }],
        "body-md": ["16px", { "lineHeight": "26px", "fontWeight": "400" }]
      }
    }
  }
};
