// Mock inquirer for Jest
const inquirer = {
  prompt: async (questions: any[]) => {
    // Return default values for basic tests
    const answers: any = {};
    questions.forEach((q: any) => {
      if (q.default !== undefined) {
        answers[q.name] = q.default;
      } else if (q.type === 'list' && q.choices && q.choices.length > 0) {
        answers[q.name] = q.choices[0].value;
      } else if (q.type === 'confirm') {
        answers[q.name] = true;
      } else {
        answers[q.name] = '';
      }
    });
    return answers;
  },
};

export default inquirer;

