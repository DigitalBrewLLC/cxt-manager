"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// Mock ora for Jest
const ora = (options) => ({
    start: () => ({
        succeed: () => { },
        fail: () => { },
        info: () => { },
        text: '',
    }),
    text: '',
});
exports.default = ora;
//# sourceMappingURL=ora.js.map