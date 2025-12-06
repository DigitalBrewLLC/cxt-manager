// Mock ora for Jest
const ora = (options?: any) => ({
  start: () => ({
    succeed: () => {},
    fail: () => {},
    info: () => {},
    text: '',
  }),
  text: '',
});

export default ora;

