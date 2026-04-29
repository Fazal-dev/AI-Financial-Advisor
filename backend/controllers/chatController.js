const memoryService = require("../services/memoryService");
const { askFinancialQuestion } = require("../services/hfService");
const { buildRagContext } = require("../services/ragService");
const fs = require("fs");

// ─── MAIN HANDLER ─────────────────────────────────────────────────────────────
exports.handleChat = async (req, res) => {
  try {
    const message = (req.body.message || "").trim();
    const file = req.file;
    const sessionId = req.body.sessionId || "user1"; // support multi-session later

    // ── STEP 1: Check request limit ──────────────────────────────────────────
    if (memoryService.isLimitReached(sessionId)) {
      return res.json({ 
        reply: "⚠️ **Chat limit reached.** Please click 'Clear Chat' to start a new session!" 
      });
    }

    // ── STEP 2: If a file was uploaded, parse it and store its RAG context ────
    let fileNotice = null;

    if (file) {
      try {

        // Build RAG context from the document
        const ragContext = await buildRagContext(file.path, message || "summarize");

        // Persist in session so follow-up questions can reference it
        memoryService.setDocumentContext(sessionId, ragContext);

        fileNotice = `📄 **${file.originalname}** uploaded and indexed. Ask me anything about it!`;

        // Clean up temp file
        fs.unlink(file.path, () => {});
      } catch (parseErr) {
        console.error("File parse error:", parseErr.message);
        fs.unlink(file.path, () => {});
        return res.status(400).json({
          error: `Could not read the file: ${parseErr.message}`,
        });
      }
    }

    // ── STEP 2: If there's no user message, just confirm the upload ──────────
    if (!message) {
      if (fileNotice) {
        // Still add the file notice as an assistant message in history
        memoryService.addMessage(sessionId, "assistant", fileNotice);
        return res.json({ reply: fileNotice });
      }
      return res.status(400).json({ error: "No message or file provided." });
    }

    // ── STEP 3: Retrieve conversation history ─────────────────────────────────
    const history = memoryService.getHistory(sessionId);

    // ── STEP 4: Retrieve RAG context (from current upload or stored session) ──
    const ragContext = memoryService.getDocumentContext(sessionId);

    // ── STEP 5: Ask LLM with full history + RAG context ──────────────────────
    console.log(`💬 [${sessionId}] User: ${message}`);
    if (ragContext) console.log("📎 RAG context injected");

    const reply = await askFinancialQuestion(message, history, ragContext);

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
