const js = require("@eslint/js");

module.exports = [
    js.configs.recommended,
    {
        languageOptions: {
            ecmaVersion: "latest",
            globals: {
                // Browser globals
                window: "readonly",
                document: "readonly",
                navigator: "readonly",
                localStorage: "readonly",
                fetch: "readonly",
                performance: "readonly",
                requestAnimationFrame: "readonly",
                setTimeout: "readonly",
                clearTimeout: "readonly",
                IntersectionObserver: "readonly",
                FormData: "readonly",
                URLSearchParams: "readonly",
                AbortController: "readonly",
                prompt: "readonly",
                // Node/shared globals
                URL: "readonly",
                Date: "readonly",
                Map: "readonly",
                Array: "readonly",
                JSON: "readonly",
                Promise: "readonly",
                module: "readonly",
                require: "readonly",
                process: "readonly",
                exports: "writable",
                global: "writable",
                console: "readonly",
                // Jest globals
                jest: "readonly",
                describe: "readonly",
                test: "readonly",
                expect: "readonly",
                beforeEach: "readonly",
                afterEach: "readonly",
            },
        },
        rules: {
            "no-unused-vars": "warn",
            "no-console": "off",
            "prefer-const": "warn",
            "no-inner-declarations": "off",
        },
    },
];
