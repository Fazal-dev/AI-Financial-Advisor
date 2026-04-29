const chatBox = document.getElementById("chat-box");
const inputEl = document.getElementById("message");
const sendBtn = document.getElementById("send-btn");
const fileInput = document.getElementById("file-input");
const filePill = document.getElementById("file-pill");

let attachedFile = null;

// ---- Welcome message ----
window.onload = () => {
  addMsg(
    "Hello! I'm your AI Financial Advisor. Ask me anything about budgeting, saving, investing, or upload a CSV report.",
    "bot",
  );
};

function getTime() {
  return new Date().toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });
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
  bubble.textContent = text;

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
  bubble.className = "bubble";
  bubble.textContent = "Thinking...";

  msg.appendChild(bubble);
  chatBox.appendChild(msg);
}

function removeTyping() {
  const t = document.getElementById("typing");
  if (t) t.remove();
}

// 🔥 HANDLE FILE
function handleFile(e) {
  const file = e.target.files[0];
  if (!file) return;

  attachedFile = file;

  filePill.innerHTML = `
    <div class="pill">
      ${file.name}
      <button onclick="clearFile()">×</button>
    </div>
  `;
}

function clearFile() {
  attachedFile = null;
  filePill.innerHTML = "";
}

// 🔥 SEND MESSAGE (FIXED)
async function sendMessage() {
  const text = inputEl.value.trim();

  if (!text && !attachedFile) return;

  addMsg(text || `[Uploaded: ${attachedFile.name}]`, "user");
  inputEl.value = "";
  inputEl.style.height = 'auto';

  showTyping();

  try {
    const formData = new FormData();

    if (text) formData.append("message", text);
    if (attachedFile) formData.append("file", attachedFile);

    const res = await fetch("http://localhost:5000/api/chat", {
      method: "POST",
      body: formData,
    });

    const data = await res.json();
    removeTyping();

    if (data.error) {
      addMsg("Error: " + data.error, "bot", true);
    } else {
      addMsg(data.reply, "bot");
    }

    clearFile();
  } catch (err) {
    removeTyping();
    addMsg("Server error. Make sure backend is running.", "bot", true);
  }
}

// ENTER key
inputEl.addEventListener("keydown", (e) => {
  if (e.key === "Enter") {
    e.preventDefault();
    sendMessage();
  }
});

// 🔥 QUICK SEND
function quickSend(text) {
  inputEl.value = text;
  sendMessage();
}

// 🔥 AUTO RESIZE TEXTAREA
function autoResize(textarea) {
  textarea.style.height = 'auto';
  textarea.style.height = textarea.scrollHeight + 'px';
}
