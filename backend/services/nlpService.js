/**
 * NLP Service: Identifies the user's financial intent and extracts entities.
 */

exports.processMessage = async (message) => {
  const msg = message.toLowerCase();
  
  // ─── INTENT DETECTION ──────────────────────────────────────────────────────
  let intent = "general";
  
  if (msg.includes("invest") || msg.includes("stock") || msg.includes("buy")) {
    intent = "investment";
  } else if (msg.includes("save") || msg.includes("budget") || msg.includes("50/30/20")) {
    intent = "savings";
  } else if (msg.includes("risk") || msg.includes("safe") || msg.includes("danger")) {
    intent = "risk";
  } else if (msg.includes("wrong") || msg.includes("mistake") || msg.includes("actually")) {
    intent = "correction";
  } else if (msg.includes("summary") || msg.includes("analyze") || msg.includes("report")) {
    intent = "analysis";
  }

  // ─── ENTITY EXTRACTION (Amounts) ──────────────────────────────────────────
  const amountMatch = msg.match(/\d+(?:,\d+)?(?:\.\d+)?/);
  const amount = amountMatch ? parseFloat(amountMatch[0].replace(/,/g, "")) : null;

  return { intent, amount, original: message };
};