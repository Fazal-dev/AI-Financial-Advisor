const fs = require("fs");
const path = require("path");
const { parse } = require("csv-parse/sync");

// pdf-parse v1.1.1 exports the parser function directly as module.exports.
const pdfParse = require("pdf-parse");

async function loadPdf(filePath) {
  const buffer = fs.readFileSync(filePath);
  const data = await pdfParse(buffer);
  return data.text || "";
}

// ─── CSV LOADER ───────────────────────────────────────────────────────────────
function loadCsv(filePath) {
  const raw = fs.readFileSync(filePath, "utf8");
  const records = parse(raw, {
    columns: true,
    skip_empty_lines: true,
    trim: true,
  });

  // Convert each row to a readable sentence
  return records
    .map((row) =>
      Object.entries(row)
        .map(([k, v]) => `${k}: ${v}`)
        .join(", ")
    )
    .join("\n");
}

// ─── PLAIN TEXT LOADER ────────────────────────────────────────────────────────
function loadTxt(filePath) {
  return fs.readFileSync(filePath, "utf8");
}

// ─── DISPATCH BY FILE TYPE ────────────────────────────────────────────────────
async function extractText(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  if (ext === ".pdf") return await loadPdf(filePath);
  if (ext === ".csv") return loadCsv(filePath);
  return loadTxt(filePath); // .txt fallback
}

// ─── CHUNKER ──────────────────────────────────────────────────────────────────
// Splits text into overlapping chunks so no context is lost at boundaries.
function chunkText(text, chunkSize = 600, overlap = 100) {
  const words = text.split(/\s+/);
  const chunks = [];

  for (let i = 0; i < words.length; i += chunkSize - overlap) {
    const chunk = words.slice(i, i + chunkSize).join(" ");
    if (chunk.trim()) chunks.push(chunk);
    if (i + chunkSize >= words.length) break;
  }

  return chunks;
}

// ─── NAIVE TF-IDF RETRIEVER ───────────────────────────────────────────────────
// No vector DB needed — scores chunks by term frequency overlap with the query.
function scoreChunk(chunk, queryTerms) {
  const lower = chunk.toLowerCase();
  return queryTerms.reduce((score, term) => {
    const regex = new RegExp(term, "gi");
    const matches = lower.match(regex);
    return score + (matches ? matches.length : 0);
  }, 0);
}

function retrieveTopChunks(chunks, query, topK = 3) {
  const stopWords = new Set([
    "the", "a", "an", "is", "are", "was", "were", "in", "on", "at",
    "to", "for", "of", "and", "or", "but", "i", "my", "me", "what",
    "how", "why", "when", "where", "can", "do", "does", "this", "that",
  ]);
  const queryTerms = query
    .toLowerCase()
    .split(/\W+/)
    .filter((t) => t.length > 2 && !stopWords.has(t));

  const scored = chunks
    .map((chunk, i) => ({ chunk, score: scoreChunk(chunk, queryTerms), i }))
    .sort((a, b) => b.score - a.score);

  return scored.slice(0, topK).map((s) => s.chunk);
}

// ─── PUBLIC API ───────────────────────────────────────────────────────────────

/**
 * Process a file and return top relevant chunks for the user query.
 * @param {string} filePath  - absolute path to uploaded file
 * @param {string} query     - the user's question
 * @returns {Promise<string>} - context string ready to inject into prompt
 */
async function buildRagContext(filePath, query) {
  const text = await extractText(filePath);
  const chunks = chunkText(text);

  if (chunks.length === 0) return "";

  // If file is small enough, just use everything
  if (chunks.length <= 3) return text.slice(0, 3000);

  const top = retrieveTopChunks(chunks, query);
  return top.join("\n\n---\n\n");
}

module.exports = { buildRagContext, extractText, chunkText };
