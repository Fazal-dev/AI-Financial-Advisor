const memoryService = require("../services/memoryService");
const { askFinancialQuestion } = require("../services/hfService");
const { buildRagContext } = require("../services/ragService");
const nlpService = require("../services/nlpService");
const fs = require("fs");

// ─── MAIN HANDLER ─────────────────────────────────────────────────────────────
exports.handleChat = async (req, res) => {
  try {
    const message = (req.body.message || "").trim();
    const file = req.file;
    const sessionId = req.body.sessionId || "user1";

    // ── STEP 1: Check request limit ──────────────────────────────────────────
    if (memoryService.isLimitReached(sessionId)) {
      return res.json({ 
        reply: "⚠️ **Chat limit reached.** Please click 'Clear Chat' to start a new session!" 
      });
    }

    // ── STEP 2: NLP Intent Detection ─────────────────────────────────────────
    const nlpData = await nlpService.processMessage(message);
    console.log(`🎯 Detected Intent: ${nlpData.intent}`);

    if (nlpData.intent === "correction") {
      memoryService.addMistake(sessionId, message);
    }

    // ── STEP 3: Handle File Upload ───────────────────────────────────────────
    let fileNotice = null;
    if (file) {
      const ragContext = await buildRagContext(file.path, message || "summarize");
      memoryService.setDocumentContext(sessionId, ragContext);
      fileNotice = `📄 **${file.originalname}** uploaded. Ask me anything about it!`;
      fs.unlink(file.path, () => {});
    }

    if (!message) {
      if (fileNotice) {
        memoryService.addMessage(sessionId, "assistant", fileNotice);
        return res.json({ reply: fileNotice });
      }
      return res.status(400).json({ error: "No message provided." });
    }

    // ── STEP 4: Retrieve Data ────────────────────────────────────────────────
    const history = memoryService.getHistory(sessionId);
    const ragContext = memoryService.getDocumentContext(sessionId);
    const mistakes = memoryService.getMistakes(sessionId);

    // ── STEP 5: AI Call with History + RAG + Mistakes ────────────────────────
    const reply = await askFinancialQuestion(message, history, ragContext, mistakes);

    if (!reply) {
      return res.status(502).json({
        error: "AI service unavailable. Please try again shortly.",
      });
    }

    // ── STEP 6: Update conversation history & Request Count ──────────────────
    memoryService.incrementRequestCount(sessionId);
    memoryService.addMessage(sessionId, "user", message);
    memoryService.addMessage(sessionId, "assistant", reply);

    console.log(`🤖 [${sessionId}] Assistant: ${reply.slice(0, 80)}...`);

    res.json({ reply });
  } catch (err) {
    console.error("Controller error:", err);
    res.status(500).json({ error: "Server error. Please try again." });
  }
};

// ─── CLEAR SESSION ────────────────────────────────────────────────────────────
exports.clearSession = (req, res) => {
  const sessionId = req.body.sessionId || "user1";
  memoryService.clearSession(sessionId);
  res.json({ message: "Session cleared." });
};
