declare const ora: (options?: any) => {
    start: () => {
        succeed: () => void;
        fail: () => void;
        info: () => void;
        text: string;
    };
    text: string;
};
export default ora;
//# sourceMappingURL=ora.d.ts.map