// Helper to load a fresh copy of the handler for each test
const loadHandler = () => {
  jest.resetModules();
  return require('../gemini').handler;
};

describe('Gemini Function', () => {
  const ALLOWED_ORIGIN = 'https://rushizzportfolio.netlify.app';
  const CLIENT_SECRET = 'test-secret';
  const GEMINI_KEY = 'dummy-key';

  beforeEach(() => {
    process.env.CLIENT_SECRET = CLIENT_SECRET;
    process.env.GEMINI_API_KEY = GEMINI_KEY;
  });

  afterEach(() => {
    delete process.env.CLIENT_SECRET;
    delete process.env.GEMINI_API_KEY;
    if (global.fetch && global.fetch.mockClear) {
      global.fetch.mockClear();
    }
  });

  test('returns 200 for POST with allowed origin', async () => {
    const handler = loadHandler();
    global.fetch = jest.fn(() =>
      Promise.resolve({ ok: true, json: () => Promise.resolve({ ok: true }) })
    );

    const event = {
      httpMethod: 'POST',
      headers: {
        origin: ALLOWED_ORIGIN,
        'x-client-auth': CLIENT_SECRET,
        'x-forwarded-for': '1.1.1.1'
      },
      body: JSON.stringify({ prompt: 'hi', context: 'ctx' })
    };

    const res = await handler(event, {});
    expect(res.statusCode).toBe(200);
  });

  test('returns 403 for disallowed origin', async () => {
    const handler = loadHandler();
    global.fetch = jest.fn(); // should not be called

    const event = {
      httpMethod: 'POST',
      headers: {
        origin: 'https://malicious.example.com',
        'x-client-auth': CLIENT_SECRET,
        'x-forwarded-for': '2.2.2.2'
      },
      body: JSON.stringify({ prompt: 'hi', context: 'ctx' })
    };

    const res = await handler(event, {});
    expect(res.statusCode).toBe(403);
    expect(global.fetch).not.toHaveBeenCalled();
  });

  test('returns 429 after more than five requests from same IP within a minute', async () => {
    const handler = loadHandler();
    global.fetch = jest.fn(() =>
      Promise.resolve({ ok: true, json: () => Promise.resolve({ ok: true }) })
    );

    const baseEvent = {
      httpMethod: 'POST',
      headers: {
        origin: ALLOWED_ORIGIN,
        'x-client-auth': CLIENT_SECRET,
        'x-forwarded-for': '3.3.3.3'
      },
      body: JSON.stringify({ prompt: 'hi', context: 'ctx' })
    };

    for (let i = 0; i < 5; i++) {
      const res = await handler(baseEvent, {});
      expect(res.statusCode).toBe(200);
    }

    const res = await handler(baseEvent, {});
    expect(res.statusCode).toBe(429);
  });
});
