// Browser globals not in the standard lib, mirroring the ESLint globals in
// eslint.config.js. Google Analytics injects gtag/dataLayer at runtime.
declare function gtag(...args: unknown[]): void;
declare const dataLayer: unknown[];
