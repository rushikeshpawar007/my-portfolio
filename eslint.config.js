const js = require("@eslint/js");
const globals = require("globals");

module.exports = [
    js.configs.recommended,
    {
        files: ["src/**/*.js"],
        languageOptions: {
            ecmaVersion: "latest",
            globals: {
                ...globals.browser,
                gtag: "readonly",
                dataLayer: "writable",
            },
        },
    },
    {
        files: ["tests/**/*.js", "*.config.js"],
        languageOptions: {
            ecmaVersion: "latest",
            globals: {
                ...globals.node,
                // page.evaluate() callbacks run in the browser
                ...globals.browser,
            },
        },
    },
    {
        rules: {
            "no-unused-vars": "warn",
            "no-console": "off",
            "prefer-const": "warn",
            "no-inner-declarations": "off",
            "no-empty": ["error", { "allowEmptyCatch": true }],
        },
    },
];
