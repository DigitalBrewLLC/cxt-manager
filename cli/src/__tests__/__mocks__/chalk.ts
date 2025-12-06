// Mock chalk for Jest (chalk 5.x is ESM-only)
const chalk = {
  red: (text: string) => text,
  yellow: (text: string) => text,
  green: (text: string) => text,
  blue: (text: string) => text,
  gray: (text: string) => text,
  bold: (text: string) => text,
  cyan: (text: string) => text,
};

export default chalk;

