const rateLimitMap = new Map();
const RATE_LIMIT_WINDOW = 60 * 1000; // 1 minute
const MAX_REQUESTS_PER_WINDOW = 5;
const ALLOWED_ORIGIN = process.env.ALLOWED_ORIGIN || "https://rushizzportfolio.netlify.app";
const CLIENT_SECRET = process.env.CLIENT_SECRET;
const MAX_HISTORY_LENGTH = 20;
const MAX_PROMPT_LENGTH = 2000;
const FETCH_TIMEOUT_MS = 15000;

// Periodic cleanup of stale rate limit entries
function cleanupRateLimitMap() {
  const now = Date.now();
  for (const [ip, timestamps] of rateLimitMap) {
    const recent = timestamps.filter(ts => now - ts < RATE_LIMIT_WINDOW);
    if (recent.length === 0) {
      rateLimitMap.delete(ip);
    } else {
      rateLimitMap.set(ip, recent);
    }
  }
}

exports.handler = async function (event, context) {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Method Not Allowed" };
  }

  const origin = event.headers.origin || "";
  const authHeader = event.headers["x-client-auth"];

  let requestOrigin;
  try {
    requestOrigin = new URL(origin).origin;
  } catch {
    requestOrigin = "";
  }

  const allowedOrigin = new URL(ALLOWED_ORIGIN).origin;
  if (requestOrigin !== allowedOrigin) {
    return { statusCode: 403, body: "Forbidden: Invalid origin" };
  }

  if (!authHeader || authHeader !== CLIENT_SECRET) {
    return { statusCode: 403, body: "Forbidden: Invalid token" };
  }

  // Rate limiting
  const clientIp = event.headers["x-forwarded-for"] || "unknown";
  const now = Date.now();

  if (!rateLimitMap.has(clientIp)) {
    rateLimitMap.set(clientIp, []);
  }

  const timestamps = rateLimitMap.get(clientIp).filter(ts => now - ts < RATE_LIMIT_WINDOW);
  if (timestamps.length >= MAX_REQUESTS_PER_WINDOW) {
    return { statusCode: 429, body: "Rate limit exceeded. Try again later." };
  }

  timestamps.push(now);
  rateLimitMap.set(clientIp, timestamps);

  // Cleanup stale entries periodically
  if (rateLimitMap.size > 100) {
    cleanupRateLimitMap();
  }

  try {
    let parsed;
    try {
      parsed = JSON.parse(event.body);
    } catch {
      return { statusCode: 400, body: "Invalid JSON body" };
    }

    const { prompt, context: botContext, history } = parsed;

    // Input validation
    if (typeof prompt !== 'string' || !prompt.trim()) {
      return { statusCode: 400, body: "Missing or invalid prompt" };
    }
    if (prompt.length > MAX_PROMPT_LENGTH) {
      return { statusCode: 400, body: `Prompt exceeds maximum length of ${MAX_PROMPT_LENGTH} characters` };
    }
    if (botContext && typeof botContext !== 'string') {
      return { statusCode: 400, body: "Invalid context field" };
    }

    const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

    if (!GEMINI_API_KEY) {
      return { statusCode: 500, body: "Missing Gemini API Key" };
    }

    const apiUrl = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=" + GEMINI_API_KEY;

    let fullHistory = [];
    if (botContext) {
      fullHistory = [
        { role: "user", parts: [{ text: botContext }] },
        { role: "model", parts: [{ text: "Understood." }] }
      ];
    }

    if (Array.isArray(history)) {
      fullHistory = [...fullHistory, ...history.slice(-MAX_HISTORY_LENGTH)];
    }

    fullHistory.push({ role: "user", parts: [{ text: prompt }] });

    const payload = { contents: fullHistory };

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

    let response;
    try {
      response = await fetch(apiUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
        signal: controller.signal
      });
    } finally {
      clearTimeout(timeout);
    }

    if (!response.ok) {
      const status = response.status;
      return {
        statusCode: status,
        body: `Gemini API Error: request failed with status ${status}`
      };
    }

    const data = await response.json();
    return { statusCode: 200, body: JSON.stringify(data) };

  } catch (error) {
    if (error.name === 'AbortError') {
      return { statusCode: 504, body: "Gemini API request timed out" };
    }
    console.error("Gemini Function Error:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Server Error" })
    };
  }
};
