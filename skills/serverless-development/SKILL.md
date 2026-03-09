---
name: serverless-development
description: Use when creating, modifying, or debugging Netlify serverless functions, working with the AI Finance Bot API, or handling CORS, rate limiting, or authentication in the backend
---

## Overview

Guides development of Netlify serverless functions used by the portfolio site, including the Gemini-powered AI Finance Bot with rate limiting, CORS, and client authentication.

## When to Use

- Creating new Netlify functions
- Modifying the Gemini AI Finance Bot function
- Debugging CORS or authentication issues
- Adding rate limiting or security features
- Writing tests for serverless functions

## Architecture

Functions live in `netlify/functions/`. Each exports a `handler(event, context)` async function. Tests live in `netlify/functions/__tests__/`.

```
netlify/functions/
├── gemini.js          # AI Finance Bot API (Gemini integration)
└── __tests__/
    └── gemini.test.js # Jest unit tests
```

Netlify config in `netlify.toml` defines build settings, security headers, and cache policies.

## The Process

### Creating a New Function

1. Create `netlify/functions/your-function.js`
2. Export an async `handler(event, context)` function
3. Return `{ statusCode, headers, body }` — always include CORS headers
4. Create `netlify/functions/__tests__/your-function.test.js`
5. Write tests FIRST (RED), then implement (GREEN)
6. Run `npm test` to verify

### Function Template

```javascript
exports.handler = async (event, context) => {
  const headers = {
    "Access-Control-Allow-Origin": "https://yourdomain.com",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Content-Type": "application/json"
  };

  if (event.httpMethod === "OPTIONS") {
    return { statusCode: 204, headers, body: "" };
  }

  if (event.httpMethod !== "POST") {
    return { statusCode: 405, headers, body: JSON.stringify({ error: "Method not allowed" }) };
  }

  try {
    const body = JSON.parse(event.body);
    // Your logic here
    return { statusCode: 200, headers, body: JSON.stringify({ result }) };
  } catch (error) {
    return { statusCode: 500, headers, body: JSON.stringify({ error: "Internal error" }) };
  }
};
```

### Security Checklist

- Validate `Origin` header against allowed domains
- Use environment variables for API keys — never hardcode
- Implement rate limiting for public endpoints
- Validate and sanitize all input from `event.body`
- Return generic error messages — never expose stack traces

### Testing Pattern

```javascript
const { handler } = require("../your-function");

describe("your-function", () => {
  it("handles OPTIONS preflight", async () => {
    const result = await handler({ httpMethod: "OPTIONS" });
    expect(result.statusCode).toBe(204);
  });

  it("rejects non-POST methods", async () => {
    const result = await handler({ httpMethod: "GET" });
    expect(result.statusCode).toBe(405);
  });

  it("processes valid requests", async () => {
    const result = await handler({
      httpMethod: "POST",
      body: JSON.stringify({ /* test data */ }),
      headers: { origin: "https://yourdomain.com" }
    });
    expect(result.statusCode).toBe(200);
  });
});
```

## Common Mistakes

- Forgetting CORS headers on error responses (browser blocks the error)
- Not handling OPTIONS preflight requests
- Hardcoding API keys instead of using environment variables
- Missing rate limiting on public endpoints
- Not validating request body before parsing
