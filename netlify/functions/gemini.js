const rateLimitMap = new Map();
const RATE_LIMIT_WINDOW = 60 * 1000; // 1 minute
const MAX_REQUESTS_PER_WINDOW = 5;
const ALLOWED_REFERER = "https://rushizzportfolio.netlify.app";
const ALLOWED_ORIGIN = new URL(ALLOWED_REFERER).origin;
const CLIENT_SECRET = process.env.CLIENT_SECRET;

exports.handler = async function (event, context) {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Method Not Allowed" };
  }

  // ✅ Use Origin instead of Referer
  const origin = event.headers.origin || "";
  const authHeader = event.headers["x-client-auth"];

  let requestOrigin;
  try {
    requestOrigin = new URL(origin).origin;
  } catch {
    requestOrigin = "";
  }

  if (requestOrigin !== ALLOWED_ORIGIN) {
    return { statusCode: 403, body: "Forbidden: Invalid origin" };
  }

  if (!authHeader || authHeader !== CLIENT_SECRET) {
    return { statusCode: 403, body: "Forbidden: Invalid token" };
  }

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

  try {
    const { prompt, context: botContext, history } = JSON.parse(event.body);
    const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

    if (!GEMINI_API_KEY) {
      return { statusCode: 500, body: "Missing Gemini API Key" };
    }

    const apiUrl = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=" + GEMINI_API_KEY;

    let fullHistory = [
      { role: "user", parts: [{ text: botContext }] },
      { role: "model", parts: [{ text: "Understood." }] }
    ];

    if (Array.isArray(history)) {
      fullHistory = [...fullHistory, ...history];
    }

    fullHistory.push({ role: "user", parts: [{ text: prompt }] });

    const payload = { contents: fullHistory };

    const response = await fetch(apiUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      const errorText = await response.text();
      return {
        statusCode: response.status,
        body: `Gemini API Error: ${errorText}`
      };
    }

    const data = await response.json();
    return { statusCode: 200, body: JSON.stringify(data) };

  } catch (error) {
    console.error("Gemini Function Error:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Server Error", details: error.message })
    };
  }
};
