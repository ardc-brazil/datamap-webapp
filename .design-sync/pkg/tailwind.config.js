const path = require("path");
const app = require("../../tailwind.config.js");

const root = path.resolve(__dirname, "../..");
const palette = "primary|secondary|error|success|embargo|danger";
const semantic = "background|foreground|card|popover|muted|accent|destructive|border|input|ring";

module.exports = {
  ...app,
  content: [
    `${root}/pages/**/*.{js,ts,jsx,tsx}`,
    `${root}/components/**/*.{js,ts,jsx,tsx}`,
    `${root}/.design-sync/previews/**/*.tsx`,
  ],
  safelist: [
    { pattern: new RegExp(`^(bg|text|border|ring|fill|divide|outline)-(${palette})-(0|50|100|200|300|400|500|600|700|800|900)$`), variants: ["hover"] },
    { pattern: new RegExp(`^(bg|text|border|ring)-(${semantic}|primary|secondary)(-foreground)?$`), variants: ["hover"] },
  ],
};
