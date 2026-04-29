const hfService = require("./hfService");

// 🔥 KNOWLEDGE BASE
const knowledgeBase = {
  inflation: "Inflation is the increase in prices over time, reducing purchasing power.",
  revenue: "Revenue is the total income generated before expenses.",
  profit: "Profit is what remains after expenses are deducted from revenue.",
  loss: "Loss occurs when expenses exceed revenue.",
  budget: "A budget helps manage income and expenses effectively.",
  saving: "Saving means setting aside money for future use.",
  expenses: "Expenses are the costs incurred in daily life or business.",
  investment: "Investment is allocating money into assets to generate returns.",
  risk: "Financial risk is the possibility of losing money.",
  debt: "Debt is borrowed money that must be repaid with interest.",
  stock: "Stocks represent ownership in a company.",
  diversification: "Diversification reduces risk by spreading investments.",
  compound: "Compound interest earns interest on both principal and previous interest.",
  roi: "ROI measures the return on investment as a percentage.",
  emergency: "An emergency fund should cover 3–6 months of expenses."
};

// 🔥 INTENT PATTERNS
const intents = [
  {
    name: "greeting",
    patterns: ["hello", "hi", "hey"]
  },
  {
    name: "investment",
    patterns: ["invest ", "investment", "investing", "should i invest", "can i invest"]
  },
  {
    name: "risk",
    patterns: ["risk", "safe", "danger", "loss"]
  },
  {
    name: "expenses",
    patterns: ["expense", "spending", "cost"]
  },
  {
    name: "saving",
    patterns: ["save", "saving", "save money", "reduce expenses", "cut costs"]
  }
];

// 🔥 INTENT DETECTION
function detectIntent(text) {
  let bestMatch = { intent: "unknown", score: 0 };

  for (let intent of intents) {
    let score = 0;

    for (let pattern of intent.patterns) {
      if (text.includes(pattern)) score++;
    }

    if (score > bestMatch.score) {
      bestMatch = { intent: intent.name, score };
    }
  }

  return bestMatch.intent;
}

// 🔥 MAIN FUNCTION
exports.processMessage = async (message) => {
  const text = message.toLowerCase().trim();

  // 🔹 extract number
  let amount = null;
  const match = text.match(/\d+/);
  if (match) amount = parseInt(match[0]);

  // 🔥 PRIORITY: CSV / ANALYSIS (FIXED)
  if (
    text.includes("analyze") ||
    text.includes("analysis") ||
    text.includes("report") ||
    text.includes("csv")
  ) {
    return { intent: "analysis" };
  }

  // 🔹 detect intent
  const intent = detectIntent(text);

  // 🔹 structured intent
  if (intent !== "unknown") {
    return { intent, amount };
  }

  // 🔹 knowledge base
  for (let key in knowledgeBase) {
    if (text.includes(key)) {
      return {
        intent: "ai",
        aiResponse: knowledgeBase[key]
      };
    }
  }

  // 🔹 AI fallback
  try {
    const aiResponse = await hfService.askFinancialQuestion(message);

    if (aiResponse && aiResponse.length > 15) {
      return {
        intent: "ai",
        aiResponse: aiResponse.trim()
      };
    }
  } catch (err) {
    console.log("AI failed:", err.message);
  }

  // 🔹 final fallback
  return {
    intent: "unknown",
    aiResponse: "I'm sorry, I didn't quite catch that. As an AI Financial Advisor, I can help you with topics like budgeting, saving, investments, and understanding financial concepts. Feel free to ask me anything about your finances!"
  };
};