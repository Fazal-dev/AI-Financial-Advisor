# AI Financial Advisor 📈🤖

A premium, intelligent financial advisor built with a **Hybrid RAG (Retrieval-Augmented Generation) architecture**. This system goes beyond simple chat by analyzing your financial documents (CSV/PDF) and learning from your corrections in real-time.

## ✨ Key Features

- **📄 Document Intelligence (RAG):** Upload CSV financial reports or PDF statements. The system chunks the data and uses keyword-based retrieval to provide grounded, non-hallucinated answers.
- **🎯 Hybrid NLP Layer:** Detects specific financial intents (Investment, Savings, Risk, Analysis) and extracts entities like currency amounts.
- **🧠 Self-Learning Memory:** Recognizes when you correct its mistakes (e.g., "Actually, that's wrong...") and stores those corrections to avoid repeating errors in the same session.
- **⚡ Ultra-Fast Responses:** Powered by **Llama 3.3 (70B)** via Groq for near-instant, high-quality financial reasoning.
- **🛡️ Secure & Grounded:** Strict system prompts prevent the AI from inventing data. It explicitly prioritizes your uploaded documents over general knowledge.
- **⏱️ Session Management:** Includes a rolling 20-message memory window and a configurable 20-request limit per session.

## 🛠️ Tech Stack

- **Frontend:** Vanilla HTML5, CSS3 (Modern Glassmorphism Design), and JavaScript.
- **Backend:** Node.js & Express.
- **AI/LLM:** Groq Cloud API (Llama 3.3 70B).
- **Parsers:** `pdf-parse` for document extraction and `csv-parse` for financial data processing.
- **File Handling:** `multer` for secure temporary file uploads.

## 🚀 Getting Started

### 1. Prerequisites
- Node.js (v18+)
- A [Groq API Key](https://console.groq.com/)

### 2. Installation
```bash
# Clone the repository
git clone https://github.com/Fazal-dev/AI-Financial-Advisor.git
cd AI-Financial-Advisor

# Install backend dependencies
cd backend
npm install
```

### 3. Configuration
Create a `.env` file in the `backend` folder:
```env
PORT=5000
GROQ_API_KEY=your_groq_api_key_here
```

### 4. Run the Project
```bash
# Start the backend (with nodemon)
npm run dev
```
Open your browser and navigate to `http://localhost:5000`.

## 📂 Project Structure

```text
├── backend
│   ├── controllers/    # Request logic & RAG orchestration
│   ├── routes/         # API endpoints & File upload config
│   ├── services/       # RAG, NLP, Memory, and AI logic
│   └── server.js       # Entry point
├── frontend
│   ├── index.html      # Modern chat UI
│   ├── style.css       # Premium styling & animations
│   └── script.js       # Frontend state & API calls
└── python-ai/          # (Optional) Analytical scripts
```

## ⚠️ Disclaimer
This application is for **informational and educational purposes only**. It does not constitute professional financial advice. Always consult with a certified financial planner for significant financial decisions.
