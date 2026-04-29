# AI Financial Advisor Chatbot

A full-stack AI chatbot for financial advice.
Stack: Python Flask (AI engine) + Node.js Express (API) + HTML/CSS/JS (frontend)

---

## QUICK START — 3 steps

### Step 1 — Add your HuggingFace API key

Open `backend/.env` (copy from `.env.example`) and paste your key:

```
HF_API_KEY=hf_your_token_here
```

Get a free key at: https://huggingface.co/settings/tokens

---

### Step 2 — Start the Python AI service (Terminal 1)

```bash
cd python-ai
pip install -r requirements.txt
python app.py
```

Runs on: http://localhost:5001

---

### Step 3 — Start the Node.js backend (Terminal 2)

```bash
cd backend
npm install
node server.js
```

Then open: http://localhost:5000

---

## Project Structure

```
AI-Financial-Advisor-Chatbot/
├── frontend/
│   ├── index.html       ← UI (auto-served by Node)
│   ├── style.css
│   └── script.js
├── backend/
│   ├── server.js        ← Express server (port 5000)
│   ├── .env.example     ← Copy to .env, add HF key
│   ├── routes/
│   │   └── chatRoutes.js
│   ├── controllers/
│   │   └── chatController.js
│   └── services/
│       ├── hfService.js      ← HuggingFace Mistral AI
│       ├── nlpService.js     ← Intent detection + fallback
│       ├── decisionService.js← Response builder
│       └── pythonService.js  ← Calls Python for risk/ROI
├── python-ai/
│   ├── app.py           ← Flask risk analyzer (port 5001)
│   └── requirements.txt
└── README.md
```

---

## How It Works

```
User types → frontend/script.js
           → POST /api/chat (Node port 5000)
           → nlpService (detect intent)
           → hfService (HuggingFace Mistral AI)
           → decisionService (build reply)
           → pythonService (risk/ROI calc, port 5001)
           → Response back to frontend
```

---

## Features

- Financial Q&A powered by Mistral-7B (free HuggingFace)
- Investment risk analysis (Python Flask)
- ROI calculation
- CSV/TXT report upload and analysis
- Quick-ask chips for common questions
- Local knowledge base fallback (works even if HF is down)
- Dark mode support
- Mobile responsive

---

## Troubleshooting

| Problem | Fix |
|---------|-----|
| "Cannot connect to server" | Make sure `node server.js` is running |
| "Python service failed" | Make sure `python app.py` is running |
| "invalid x-api-key" | Add HF_API_KEY to backend/.env |
| Model loading slowly | HuggingFace cold start — wait 20-30 sec, then retry |
| Port 5000 in use | Change PORT in .env |
