const chatBox = document.getElementById("chat-box");
const inputEl = document.getElementById("message");
const sendBtn = document.getElementById("send-btn");
const fileInput = document.getElementById("file-input");
const filePill = document.getElementById("file-pill");
const docBadge = document.getElementById("doc-badge");

let attachedFile = null;
const SESSION_ID = "user_" + Math.random().toString(36).slice(2, 8); // unique per tab

// ---- Welcome message ----
window.onload = () => {
  addMsg(
    "Hello! I'm your AI Financial Advisor. Ask me anything about budgeting, saving, investing, or upload a CSV/PDF financial report — I'll read it and answer questions from it.",
    "bot"
  );
};

// ─── UTILS ────────────────────────────────────────────────────────────────────
function getTime() {
  return new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

function addMsg(text, role, isError) {
  const msg = document.createElement("div");
  msg.className = "msg " + role;

  const av = document.createElement("div");
  av.className = "avatar " + role;
  av.textContent = role === "bot" ? "FA" : "You";

  const wrap = document.createElement("div");
  wrap.className = "bubble-wrap";

  const bubble = document.createElement("div");
  bubble.className = "bubble" + (isError ? " error" : "");

  // Support markdown-lite: bold **text**, line breaks
  bubble.innerHTML = text
    .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
    .replace(/\n/g, "<br>");

  const time = document.createElement("div");
  time.className = "msg-time";
  time.textContent = getTime();

  wrap.appendChild(bubble);
  wrap.appendChild(time);
  msg.appendChild(av);
  msg.appendChild(wrap);
  chatBox.appendChild(msg);
  chatBox.scrollTop = chatBox.scrollHeight;
}

function showTyping() {
  const msg = document.createElement("div");
  msg.className = "msg bot";
  msg.id = "typing";

  const bubble = document.createElement("div");
  bubble.className = "bubble typing-bubble";
  bubble.innerHTML = `<span class="dot-1">●</span><span class="dot-2">●</span><span class="dot-3">●</span>`;

  msg.appendChild(bubble);
  chatBox.appendChild(msg);
  chatBox.scrollTop = chatBox.scrollHeight;
}

function removeTyping() {
  const t = document.getElementById("typing");
  if (t) t.remove();
}

// ─── FILE HANDLING ────────────────────────────────────────────────────────────
function handleFile(e) {
  const file = e.target.files[0];
  if (!file) return;

  attachedFile = file;

  filePill.innerHTML = `
    <div class="pill">
      ${getFileIcon(file.name)} ${file.name}
      <button onclick="clearFile()">×</button>
    </div>
  `;
}

function getFileIcon(name) {
  if (name.endsWith(".pdf")) return "📄";
  if (name.endsWith(".csv")) return "📊";
  return "📎";
}

function clearFile() {
  attachedFile = null;
  fileInput.value = "";
  filePill.innerHTML = "";
}

function setDocumentActive(fileName) {
  if (docBadge) {
    docBadge.textContent = `📎 ${fileName} active`;
    docBadge.style.display = "inline-block";
  }
}

function clearDocumentBadge() {
  if (docBadge) {
    docBadge.textContent = "";
    docBadge.style.display = "none";
  }
}

// ─── SEND MESSAGE ─────────────────────────────────────────────────────────────
async function sendMessage() {
  const text = inputEl.value.trim();

  if (!text && !attachedFile) return;

  // Show user bubble
  if (text && attachedFile) {
    addMsg(`[${getFileIcon(attachedFile.name)} ${attachedFile.name}] ${text}`, "user");
  } else if (attachedFile) {
    addMsg(`${getFileIcon(attachedFile.name)} Uploaded: ${attachedFile.name}`, "user");
  } else {
    addMsg(text, "user");
  }

  inputEl.value = "";
  inputEl.style.height = "auto";
  showTyping();

  try {
    const formData = new FormData();
    formData.append("sessionId", SESSION_ID);
    if (text) formData.append("message", text);
    if (attachedFile) formData.append("file", attachedFile);

    const uploadedFileName = attachedFile ? attachedFile.name : null;
    clearFile();

    const res = await fetch("/api/chat", {
      method: "POST",
      body: formData,
    });

    const data = await res.json();
    removeTyping();

    if (data.error) {
      addMsg("⚠️ " + data.error, "bot", true);
    } else {
      addMsg(data.reply, "bot");
      if (uploadedFileName) setDocumentActive(uploadedFileName);
    }
  } catch (err) {
    removeTyping();
    addMsg("Server error. Make sure backend is running.", "bot", true);
  }
}

// ─── CLEAR CHAT ───────────────────────────────────────────────────────────────
async function clearChat() {
  chatBox.innerHTML = "";
  clearDocumentBadge();
  try {
    await fetch("/api/chat/clear", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sessionId: SESSION_ID }),
    });
  } catch (_) {}
  addMsg("Session cleared! How can I help you?", "bot");
}

// ─── KEY BINDINGS ─────────────────────────────────────────────────────────────
inputEl.addEventListener("keydown", (e) => {
  if (e.key === "Enter" && !e.shiftKey) {
    e.preventDefault();
    sendMessage();
  }
});

// ─── QUICK SEND ───────────────────────────────────────────────────────────────
function quickSend(text) {
  inputEl.value = text;
  sendMessage();
}

// ─── AUTO RESIZE TEXTAREA ─────────────────────────────────────────────────────
function autoResize(textarea) {
  textarea.style.height = "auto";
  textarea.style.height = Math.min(textarea.scrollHeight, 150) + "px";
}
