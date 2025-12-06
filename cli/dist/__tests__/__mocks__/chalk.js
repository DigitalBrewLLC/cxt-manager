"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// Mock chalk for Jest (chalk 5.x is ESM-only)
const chalk = {
    red: (text) => text,
    yellow: (text) => text,
    green: (text) => text,
    blue: (text) => text,
    gray: (text) => text,
    bold: (text) => text,
    cyan: (text) => text,
};
exports.default = chalk;
//# sourceMappingURL=chalk.js.map