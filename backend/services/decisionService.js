const pythonService = require("./pythonService");

exports.makeDecision = async ({ intent, amount, aiResponse }) => {
  const income = 1000000;
  const expenses = 700000;
  const cash = income - expenses;

  try {
    if (intent === "greeting") {
      return "Hello! I can help with investments, risk, and financial advice.";
    }

    if (intent === "investment") {
      const investAmount = amount || 200000;

      const analysis = await pythonService.getAnalysis({
        income,
        expenses,
        investment: investAmount
      });

      const { risk, roi } = analysis;

      if (risk === "High") {
        return "High risk detected. Investment not recommended.";
      }

      if (investAmount > cash) {
        return "Insufficient cash flow for this investment.";
      }

      return `Investment approved. Risk: ${risk}, ROI: ${roi.toFixed(2)}%`;
    }

    if (intent === "risk") {
      const analysis = await pythonService.getAnalysis({
        income,
        expenses,
        investment: 0
      });

      return `Your current financial risk level is ${analysis.risk}.`;
    }

    if (intent === "expenses") {
      return `Your expenses are ${expenses}. Try reducing unnecessary costs.`;
    }

    if (intent === "saving") {
      return "You can save money by budgeting, reducing unnecessary expenses, and setting aside a fixed portion of your income.";
    }

    if (intent === "analysis") {
      return "Please upload a CSV financial report to analyze.";
    }

    if (intent === "ai") {
      return aiResponse;
    }

    if (intent === "unknown" && aiResponse) {
      return aiResponse;
    }

    return "I'm sorry, I didn't quite catch that. As an AI Financial Advisor, I can help you with topics like budgeting, saving, investments, and understanding financial concepts. Feel free to ask me anything about your finances!";

  } catch (err) {
    console.error(err.message);
    return "Server error. Please try again.";
  }
};