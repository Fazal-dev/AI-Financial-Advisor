/**
 * In-memory session store.
 * Stores full conversation history per session so the LLM always has context.
 */

const sessions = {};

const MAX_HISTORY = 20; // max messages kept per session
const MAX_REQUESTS = 20; // 🛑 limit per session

// ─── GET / INIT SESSION ───────────────────────────────────────────────────────
exports.getSession = (sessionId) => {
  if (!sessions[sessionId]) {
    sessions[sessionId] = {
      history: [],
      requestCount: 0,       // Track total requests
      lastIntent: null,
      lastAmount: null,
      documentContext: null,
    };
  }
  return sessions[sessionId];
};

exports.incrementRequestCount = (sessionId) => {
  const session = exports.getSession(sessionId);
  session.requestCount++;
  return session.requestCount;
};

exports.isLimitReached = (sessionId) => {
  const session = exports.getSession(sessionId);
  return session.requestCount >= MAX_REQUESTS;
};

// ─── ADD A SINGLE MESSAGE ─────────────────────────────────────────────────────
exports.addMessage = (sessionId, role, content) => {
  const session = exports.getSession(sessionId);
  session.history.push({ role, content });

  // Rolling window — keep last MAX_HISTORY messages
  if (session.history.length > MAX_HISTORY) {
    session.history = session.history.slice(session.history.length - MAX_HISTORY);
  }
};

// ─── STORE RAG DOCUMENT CONTEXT ───────────────────────────────────────────────
exports.setDocumentContext = (sessionId, context) => {
  const session = exports.getSession(sessionId);
  session.documentContext = context;
};

// ─── GET DOCUMENT CONTEXT ─────────────────────────────────────────────────────
exports.getDocumentContext = (sessionId) => {
  return exports.getSession(sessionId).documentContext || null;
};

// ─── LEGACY UPDATE (keep compatibility) ───────────────────────────────────────
exports.updateSession = (sessionId, data) => {
  const session = exports.getSession(sessionId);
  if (data.intent) session.lastIntent = data.intent;
  if (data.amount) session.lastAmount = data.amount;
};

// ─── GET FORMATTED HISTORY FOR LLM ───────────────────────────────────────────
exports.getHistory = (sessionId) => {
  return exports.getSession(sessionId).history;
};

// ─── CLEAR SESSION ────────────────────────────────────────────────────────────
exports.clearSession = (sessionId) => {
  delete sessions[sessionId];
};