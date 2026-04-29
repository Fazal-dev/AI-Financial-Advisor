const axios = require("axios");

if (!process.env.GROQ_API_KEY) {
  throw new Error("Missing GROQ_API_KEY in environment");
}

// ─── SYSTEM PROMPT ────────────────────────────────────────────────────────────
const BASE_SYSTEM = `You are a professional AI Financial Advisor.
Your role is to give clear, grounded, and practical financial advice.

Rules to prevent hallucination:
- ONLY use facts from the conversation history or the provided document context.
- If you are not sure about a specific number or fact, say so clearly.
- Never invent financial data, account balances, or statistics.
- If a document was uploaded, base your answer on that document's data.
- If no document is provided, give general financial education only.
- Be concise (2-8 sentences), human-like, and actionable.`;

// ─── MAIN EXPORT ─────────────────────────────────────────────────────────────
/**
 * @param {string} userMessage      - latest user question
 * @param {Array}  history          - [{role, content}, ...] full chat history
 * @param {string|null} ragContext  - relevant document chunks from ragService
 */
exports.askFinancialQuestion = async (userMessage, history = [], ragContext = null) => {
  try {
    const result = await askGroq(userMessage, history, ragContext);
    if (result) {
      console.log("🟢 GROQ SUCCESS");
      return result;
    }
    console.log("⚠️ Groq returned empty response");
    return null;
  } catch (err) {
    console.error("❌ askFinancialQuestion error:", err.message);
    return null;
  }
};

async function askGroq(userMessage, history, ragContext) {
  let systemPrompt = BASE_SYSTEM;
  if (ragContext) {
    systemPrompt += `\n\n--- DOCUMENT CONTEXT (from uploaded file) ---\n${ragContext}\n--- END OF DOCUMENT CONTEXT ---\n\nUse the above document data to answer the user's question precisely.`;
  }

  // Build message array: system → full history → current user message
  const messages = [
    { role: "system", content: systemPrompt },
    ...history,                                     
    { role: "user", content: userMessage },          
  ];

  try {
    const res = await axios.post(
      "https://api.groq.com/openai/v1/chat/completions",
      {
        model: "llama-3.3-70b-versatile",
        messages,
        temperature: 0.4,  
        max_tokens: 1024,
        top_p: 0.9,
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
          "Content-Type": "application/json",
        },
        timeout: 30000,
      }
    );

    return res.data?.choices?.[0]?.message?.content?.trim() || null;
  } catch (err) {
    console.error(
      "Groq API error:",
      err.response?.status,
      JSON.stringify(err.response?.data)
    );
    return null;
  }
}
