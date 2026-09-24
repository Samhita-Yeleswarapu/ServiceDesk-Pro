/**
 * AI Service
 * ----------
 * Classifies incoming ticket text into a category/priority/probable-issue,
 * proposes a first-line resolution, and retrieves relevant knowledge-base
 * articles.
 *
 * - If GEMINI_API_KEY (Google AI Studio key) is set in .env, Google Gemini is
 *   used for classification, resolution suggestions and KB re-ranking.
 * - If the key is missing, or a Gemini call fails for any reason (quota,
 *   network, bad key), the built-in keyword engine below is used instead, so
 *   ticket creation never breaks.
 */

const KnowledgeArticle = require("../models/KnowledgeArticle");
const Category = require("../models/Category");

// Keyword banks mapped to category names + probable issue + priority hints
const KEYWORD_MAP = [
  { keywords: ["password", "login", "locked out", "authentication", "2fa", "otp"], category: "Account & Access", issue: "Account access / password issue", priority: "Medium" },
  { keywords: ["laptop", "desktop", "monitor", "screen", "keyboard", "mouse", "hardware", "battery", "charger"], category: "Hardware", issue: "Hardware malfunction", priority: "Medium" },
  { keywords: ["wifi", "network", "internet", "vpn", "lan", "connectivity", "dns", "ip address"], category: "Network", issue: "Network connectivity issue", priority: "High" },
  { keywords: ["email", "outlook", "mailbox", "smtp", "spam"], category: "Email & Communication", issue: "Email service issue", priority: "Medium" },
  { keywords: ["software", "install", "license", "application", "app crash", "update", "bug", "error"], category: "Software", issue: "Software issue / bug", priority: "Medium" },
  { keywords: ["server", "database", "down", "outage", "production", "crash", "critical", "urgent", "not working"], category: "Infrastructure", issue: "Critical system outage", priority: "Critical" },
  { keywords: ["printer", "scanner", "print", "toner"], category: "Hardware", issue: "Printer / peripheral issue", priority: "Low" },
  { keywords: ["security", "virus", "malware", "phishing", "breach", "suspicious"], category: "Security", issue: "Security incident", priority: "Critical" },
  { keywords: ["asset", "laptop request", "new equipment", "procurement"], category: "Asset Request", issue: "New asset / equipment request", priority: "Low" },
];

const CRITICAL_WORDS = ["urgent", "asap", "critical", "down", "outage", "immediately", "production"];
const HIGH_WORDS = ["important", "blocked", "cannot work", "can't work", "high priority"];


// ---------------------------------------------------------------------------
// Google Gemini client (Google AI Studio API key)
// ---------------------------------------------------------------------------
const GEMINI_BASE = "https://generativelanguage.googleapis.com/v1beta/models";
const VALID_PRIORITIES = ["Low", "Medium", "High", "Critical"];

function getGeminiKey() {
  const key = (process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY || "").trim();
  return key && !/^your[_-]/i.test(key) ? key : "";
}

function isGeminiEnabled() {
  return Boolean(getGeminiKey());
}

// Model to try first, then fall back to widely available aliases.
function modelCandidates() {
  const list = [
    (process.env.GEMINI_MODEL || "").trim(),
    "gemini-flash-latest",
    "gemini-2.5-flash",
    "gemini-2.0-flash",
  ].filter(Boolean);
  return [...new Set(list)];
}

let workingModel = null; // remembers the first model that answered successfully
let loggedActive = false;

async function callGeminiModel(model, prompt, key) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 25000);
  try {
    const res = await fetch(`${GEMINI_BASE}/${model}:generateContent`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-goog-api-key": key },
      signal: controller.signal,
      body: JSON.stringify({
        contents: [{ role: "user", parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0.2,
          maxOutputTokens: 4096,
          responseMimeType: "application/json",
        },
      }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      const err = new Error(data?.error?.message || `Gemini HTTP ${res.status}`);
      err.status = res.status;
      throw err;
    }
    const text = (data?.candidates?.[0]?.content?.parts || [])
      .map((p) => p.text || "")
      .join("")
      .trim();
    if (!text) throw new Error("Gemini returned an empty response");
    return text;
  } finally {
    clearTimeout(timer);
  }
}

function parseJson(text) {
  const clean = text.replace(/^```(?:json)?/i, "").replace(/```$/, "").trim();
  try {
    return JSON.parse(clean);
  } catch (e) {
    const m = clean.match(/\{[\s\S]*\}/);
    if (m) return JSON.parse(m[0]);
    throw e;
  }
}

/** Sends a prompt to Gemini and returns parsed JSON, or null if unavailable. */
async function askGeminiJson(prompt) {
  const key = getGeminiKey();
  if (!key) return null;

  const models = workingModel ? [workingModel] : modelCandidates();
  let lastError = null;

  for (const model of models) {
    try {
      const text = await callGeminiModel(model, prompt, key);
      if (!loggedActive || workingModel !== model) {
        console.log(`[AI] Gemini active (model: ${model})`);
        loggedActive = true;
      }
      workingModel = model;
      return parseJson(text);
    } catch (e) {
      lastError = e;
      // Model not found / not supported -> try next candidate. Anything else -> stop.
      if (e.status === 404 || e.status === 400) {
        if (workingModel === model) workingModel = null;
        if (/api key|API_KEY/i.test(e.message)) break;
        continue;
      }
      break;
    }
  }
  console.warn(`[AI] Gemini unavailable, using local engine. Reason: ${lastError?.message}`);
  return null;
}

function scoreText(text) {
  const lower = text.toLowerCase();
  let best = null;
  let bestScore = 0;

  for (const entry of KEYWORD_MAP) {
    let score = 0;
    for (const kw of entry.keywords) {
      if (lower.includes(kw)) score += 1;
    }
    if (score > bestScore) {
      bestScore = score;
      best = entry;
    }
  }

  // priority escalation based on urgency words
  let urgencyBoost = null;
  if (CRITICAL_WORDS.some((w) => lower.includes(w))) urgencyBoost = "Critical";
  else if (HIGH_WORDS.some((w) => lower.includes(w))) urgencyBoost = "High";

  return { best, bestScore, urgencyBoost };
}

/**
 * Local (offline) classifier - used when no Gemini key is configured or when
 * a Gemini call fails.
 */
async function classifyLocally(subject, description) {
  const text = `${subject} ${description}`;
  const { best, bestScore, urgencyBoost } = scoreText(text);

  const totalKeywords = best ? best.keywords.length : 1;
  const confidence = best ? Math.min(0.95, 0.35 + (bestScore / totalKeywords) * 0.6) : 0.2;

  const categoryName = best ? best.category : "General";
  const probableIssue = best ? best.issue : "General inquiry — needs triage";
  const priority = urgencyBoost || (best ? best.priority : "Medium");

  // Try to match an existing Category document by name similarity
  let matchedCategory = null;
  try {
    matchedCategory = await Category.findOne({
      name: { $regex: categoryName.split(" ")[0], $options: "i" },
    });
  } catch (e) {
    matchedCategory = null;
  }

  return {
    suggestedCategoryName: categoryName,
    suggestedCategoryId: matchedCategory ? matchedCategory._id : null,
    suggestedPriority: priority,
    probableIssue,
    confidence: Number(confidence.toFixed(2)),
    suggestedResolution: "",
    source: "local",
  };
}

/**
 * classifyTicket: returns
 * { suggestedCategoryName, suggestedCategoryId, suggestedPriority,
 *   probableIssue, confidence, suggestedResolution, source }
 */
async function classifyTicket(subject, description) {
  if (!isGeminiEnabled()) return classifyLocally(subject, description);

  try {
    const categories = await Category.find({}).select("name description").lean();
    const categoryList = categories.length
      ? categories.map((c) => `- ${c.name}${c.description ? ": " + c.description : ""}`).join("\n")
      : "- General";

    const prompt = `You are an IT service desk triage assistant. Analyse the support ticket below.

Available categories (choose EXACTLY one name from this list):
${categoryList}

Priority levels (choose one): Low, Medium, High, Critical.
- Critical: outage, security incident, or many users fully blocked
- High: one user fully blocked or a business-critical function degraded
- Medium: partial impact with a workaround
- Low: minor issue or request

Ticket subject: ${String(subject).slice(0, 300)}
Ticket description: ${String(description).slice(0, 3000)}

Respond ONLY with a JSON object in this exact shape:
{
  "category": "<one category name from the list>",
  "priority": "<Low|Medium|High|Critical>",
  "probableIssue": "<one short sentence describing the likely root cause>",
  "confidence": <number between 0 and 1>,
  "suggestedResolution": "<2-4 short, concrete first-line troubleshooting steps written as one paragraph>"
}`;

    const ai = await askGeminiJson(prompt);
    if (!ai) return classifyLocally(subject, description);

    const wanted = String(ai.category || "").trim().toLowerCase();
    const matched =
      categories.find((c) => c.name.toLowerCase() === wanted) ||
      categories.find((c) => wanted && (c.name.toLowerCase().includes(wanted) || wanted.includes(c.name.toLowerCase())));

    const priority = VALID_PRIORITIES.find((p) => p.toLowerCase() === String(ai.priority || "").toLowerCase()) || "Medium";
    const conf = Number(ai.confidence);

    return {
      suggestedCategoryName: matched ? matched.name : String(ai.category || "General"),
      suggestedCategoryId: matched ? matched._id : null,
      suggestedPriority: priority,
      probableIssue: String(ai.probableIssue || "").slice(0, 300) || "Needs triage",
      confidence: Number.isFinite(conf) ? Number(Math.min(1, Math.max(0, conf)).toFixed(2)) : 0.8,
      suggestedResolution: String(ai.suggestedResolution || "").slice(0, 1500),
      source: "gemini",
    };
  } catch (e) {
    console.warn(`[AI] classifyTicket fell back to local engine: ${e.message}`);
    return classifyLocally(subject, description);
  }
}

/**
 * Retrieve candidate KB articles using MongoDB text search, with a simple
 * keyword-overlap fallback.
 */
async function findCandidateArticles(subject, description, limit) {
  const query = `${subject} ${description}`;
  try {
    const results = await KnowledgeArticle.find(
      { $text: { $search: query }, isPublished: true },
      { score: { $meta: "textScore" } }
    )
      .sort({ score: { $meta: "textScore" } })
      .limit(limit)
      .select("title summary category tags");

    if (results.length > 0) return results;
  } catch (e) {
    // fall through to keyword fallback
  }

  const words = query
    .toLowerCase()
    .split(/\W+/)
    .filter((w) => w.length > 3);

  const all = await KnowledgeArticle.find({ isPublished: true }).select(
    "title summary category tags content"
  );

  return all
    .map((a) => {
      const haystack = `${a.title} ${a.summary} ${a.tags.join(" ")}`.toLowerCase();
      const matchCount = words.filter((w) => haystack.includes(w)).length;
      return { article: a, matchCount };
    })
    .filter((x) => x.matchCount > 0)
    .sort((a, b) => b.matchCount - a.matchCount)
    .slice(0, limit)
    .map((x) => x.article);
}

/**
 * suggestArticles: finds the most relevant KB articles for a ticket. When
 * Gemini is enabled it re-ranks a wider candidate pool by real relevance.
 */
async function suggestArticles(subject, description, limit = 5) {
  if (!isGeminiEnabled()) return findCandidateArticles(subject, description, limit);

  try {
    // Wider pool so Gemini has something meaningful to choose from
    let pool = await findCandidateArticles(subject, description, 12);
    if (pool.length === 0) {
      pool = await KnowledgeArticle.find({ isPublished: true })
        .select("title summary category tags")
        .limit(30);
    }
    if (pool.length <= 1) return pool.slice(0, limit);

    const list = pool
      .map((a, i) => `${i}. ${a.title} — ${String(a.summary || "").slice(0, 160)}`)
      .join("\n");

    const prompt = `You are an IT service desk assistant. Pick the knowledge base articles that would genuinely help resolve this ticket.

Ticket subject: ${String(subject).slice(0, 300)}
Ticket description: ${String(description).slice(0, 2000)}

Knowledge base articles:
${list}

Return ONLY a JSON object: {"relevant": [<article numbers, most relevant first, at most ${limit}>]}
Use an empty array if none are relevant.`;

    const ai = await askGeminiJson(prompt);
    if (!ai || !Array.isArray(ai.relevant)) return pool.slice(0, limit);

    const picked = [];
    for (const idx of ai.relevant) {
      const a = pool[Number(idx)];
      if (a && !picked.includes(a)) picked.push(a);
      if (picked.length >= limit) break;
    }
    return picked;
  } catch (e) {
    console.warn(`[AI] suggestArticles fell back to local search: ${e.message}`);
    return findCandidateArticles(subject, description, limit);
  }
}

module.exports = { classifyTicket, suggestArticles, isGeminiEnabled };
