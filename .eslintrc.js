module.exports = {
    root: true,
    env: {
        browser: true
    },
    parser: '@typescript-eslint/parser',
    plugins: [
        '@typescript-eslint',
    ],
    extends: [
        'eslint:recommended',
        'plugin:@typescript-eslint/recommended',
    ],
    rules: {
        '@typescript-eslint/no-non-null-assertion': 'off',
        'no-constant-condition': ['error', { checkLoops: false }]
    }
};
