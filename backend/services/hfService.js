const axios = require("axios");

const HF_API_KEY =process.env.HF_API_KEY;
const HF_MODEL = "mistralai/Mistral-7B-Instruct-v0.2";

if (!process.env.HF_API_KEY) {
  throw new Error("Missing HF_API_KEY");
}

const SYSTEM = `You are a professional AI Financial Advisor.
Answer clearly in 2-8 sentences.
Provide practical financial advice (budgeting, saving, investing, debt).
If given financial data, summarize insights and give recommendations.
Be concise, helpful, and human-like.`;

// 🔁 retry helper
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

exports.askFinancialQuestionOIld = async (message, context = "") => {
  const prompt = `<s>[INST] ${SYSTEM} ${context ? `Context:\n${context}\n\n` : ""}User: ${message} [/INST]`;

  try {
    console.log("🔵 Sending request to HF...");

    const response = await axios.post(
      `https://api-inference.huggingface.co/models/${HF_MODEL}`,
      {
        inputs: prompt,
        parameters: {
          max_new_tokens: 3000,
          temperature: 0.7,
          return_full_text: false,
        },
        options: {
          wait_for_model: true,
        },
      },
      {
        headers: {
          Authorization: `Bearer ${HF_API_KEY}`,
          "Content-Type": "application/json",
        },
        timeout: 30000,
      },
    );

    // 🔥 HANDLE HF ERRORS
    if (response.data?.error) {
      console.log("❌ HF ERROR:", response.data.error);

      // model loading case → retry once
      if (response.data.error.includes("loading")) {
        console.log("⏳ Retrying after model load...");
        await sleep(5000);
        return exports.askFinancialQuestion(message, context);
      }

      return null;
    }

    let text = "";

    if (Array.isArray(response.data) && response.data[0]?.generated_text) {
      text = response.data[0].generated_text;
    } else if (response.data?.generated_text) {
      text = response.data.generated_text;
    }

    if (!text || text.length < 5) {
      console.log("⚠️ Empty AI response");
      return null;
    }

    // 🔥 CLEAN RESPONSE
    text = text
      .replace(/\[INST\].*?\[\/INST\]/gs, "")
      .replace(/<s>|<\/s>/g, "")
      .trim();

    console.log("🟢 HF SUCCESS");

    return text;
  } catch (error) {
    console.log("❌ HF REQUEST FAILED:");

    if (error.response) {
      console.log("Status:", error.response.status);
      console.log("Data:", error.response.data);
    } else {
      console.log("Message:", error.message);
    }

    return null;
  }
};

exports.askFinancialQuestion = async (message, context = "") => {
  const fullMessage = context ? `Context:\n${context}\n\n${message}` : message;

  // Try Groq first (free + fast)
  const groqResult = await askGroq(fullMessage);
  if (groqResult) {
    console.log("🟢 GROQ SUCCESS");
    return groqResult;
  }

  console.log("⚠️ Groq failed, no fallback available");
  return null;
};

async function askGroq(message) {
  try {
    const res = await axios.post(
      "https://api.groq.com/openai/v1/chat/completions",
      {
        model: "llama-3.3-70b-versatile",
        messages: [
          { role: "system", content: SYSTEM },
          { role: "user", content: message },
        ],
        temperature: 0.7,
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
          "Content-Type": "application/json",
        },
      },
    );

    return res.data?.choices?.[0]?.message?.content || null;
  } catch (err) {
    console.log("Groq failed");
    console.log(
      "Groq failed:",
      err.response?.status,
      JSON.stringify(err.response?.data),
    );
    return null;
  }
}
