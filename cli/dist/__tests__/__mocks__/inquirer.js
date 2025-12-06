"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// Mock inquirer for Jest
const inquirer = {
    prompt: async (questions) => {
        // Return default values for basic tests
        const answers = {};
        questions.forEach((q) => {
            if (q.default !== undefined) {
                answers[q.name] = q.default;
            }
            else if (q.type === 'list' && q.choices && q.choices.length > 0) {
                answers[q.name] = q.choices[0].value;
            }
            else if (q.type === 'confirm') {
                answers[q.name] = true;
            }
            else {
                answers[q.name] = '';
            }
        });
        return answers;
    },
};
exports.default = inquirer;
//# sourceMappingURL=inquirer.js.map