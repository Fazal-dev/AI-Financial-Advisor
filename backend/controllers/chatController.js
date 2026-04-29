const nlpService = require("../services/nlpService");
const decisionService = require("../services/decisionService");
const memoryService = require("../services/memoryService");
const pythonService = require("../services/pythonService");

exports.handleChat = async (req, res) => {
  try {
    const message = req.body.message || "";
    const file = req.file;
    const sessionId = "user1";

    const session = memoryService.getSession(sessionId);

    // STEP 1: IF FILE EXISTS → HANDLE CSV ANALYSIS
    if (file) {
      const analysis = await pythonService.analyzeCSV(file.path);

      return res.json({
        reply: `📊 Financial Analysis:\n${analysis}`,
      });
    }

    // STEP 2: NORMAL CHAT FLOW
    const nlpData = await nlpService.processMessage(message);

    const reply = await decisionService.makeDecision({
      ...nlpData,
      session,
    });

    // STEP 3: UPDATE MEMORY
    memoryService.updateSession(sessionId, {
      message,
      intent: nlpData.intent,
    });

    res.json({ reply });
  } catch (err) {
    console.error("Controller error:", err);
    res.status(500).json({ error: "Server error" });
  }
};
