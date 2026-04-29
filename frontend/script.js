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

  if (role === "bot" && !isError) {
    const ttsBtn = document.createElement("button");
    ttsBtn.className = "tts-btn";
    ttsBtn.innerHTML = `
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon>
        <path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"></path>
      </svg>
    `;
    ttsBtn.title = "Read aloud";
    ttsBtn.onclick = () => speakText(text);
    
    const actionsWrap = document.createElement("div");
    actionsWrap.className = "msg-actions";
    actionsWrap.appendChild(time);
    actionsWrap.appendChild(ttsBtn);
    wrap.appendChild(bubble);
    wrap.appendChild(actionsWrap);
  } else {
    wrap.appendChild(bubble);
    wrap.appendChild(time);
  }
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
  addMsg(
    "Hello! I'm your AI Financial Advisor. Ask me anything about budgeting, saving, investing, or upload a CSV/PDF financial report — I'll read it and answer questions from it.",
    "bot"
  );
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

// ─── VOICE TO TEXT ────────────────────────────────────────────────────────────
const micBtn = document.getElementById("mic-btn");
let recognition = null;
let isRecording = false;

if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  recognition = new SpeechRecognition();
  recognition.continuous = true;
  recognition.interimResults = true;
  recognition.lang = 'en-US';

  let finalTranscript = '';

  recognition.onstart = () => {
    isRecording = true;
    micBtn.classList.add("recording");
    finalTranscript = inputEl.value ? inputEl.value + ' ' : '';
  };

  recognition.onresult = (event) => {
    let interimTranscript = '';
    for (let i = event.resultIndex; i < event.results.length; ++i) {
      if (event.results[i].isFinal) {
        finalTranscript += event.results[i][0].transcript;
      } else {
        interimTranscript += event.results[i][0].transcript;
      }
    }
    inputEl.value = finalTranscript + interimTranscript;
    autoResize(inputEl);
  };

  recognition.onend = () => {
    isRecording = false;
    micBtn.classList.remove("recording");
  };

  recognition.onerror = (event) => {
    console.error("Speech recognition error", event.error);
    isRecording = false;
    micBtn.classList.remove("recording");
  };
}

function toggleVoiceRecording() {
  if (!recognition) {
    alert("Voice typing is not supported in this browser. Please try Chrome or Edge.");
    return;
  }
  
  if (isRecording) {
    recognition.stop();
  } else {
    recognition.start();
  }
}

// ─── TEXT TO SPEECH ───────────────────────────────────────────────────────────
// Trigger voice loading so they are ready when the button is clicked
if ('speechSynthesis' in window) {
  window.speechSynthesis.onvoiceschanged = () => {
    window.speechSynthesis.getVoices();
  };
}

function speakText(text) {
  if (!('speechSynthesis' in window)) {
    alert("Text-to-speech is not supported in this browser.");
    return;
  }
  
  window.speechSynthesis.cancel();
  
  const cleanText = text.replace(/\*\*/g, '').replace(/<[^>]*>?/gm, '');
  const utterance = new SpeechSynthesisUtterance(cleanText);
  utterance.lang = 'en-US';
  
  const voices = window.speechSynthesis.getVoices();
  
  // Prioritize popular female voices across different OS/browsers
  const preferredNames = ['Google US English', 'Microsoft Zira', 'Google UK English Female', 'Samantha', 'Victoria'];
  let selectedVoice = null;
  
  for (const name of preferredNames) {
    selectedVoice = voices.find(v => v.name.includes(name));
    if (selectedVoice) break;
  }
  
  // Fallback to any voice explicitly labeled as 'Female'
  if (!selectedVoice) {
    selectedVoice = voices.find(v => v.lang.includes('en') && v.name.includes('Female'));
  }
  
  if (selectedVoice) {
    utterance.voice = selectedVoice;
  }
  
  // Adjust pitch to make the voice sound slightly softer and more pleasant
  utterance.pitch = 1.15;
  utterance.rate = 1.0;
  
  window.speechSynthesis.speak(utterance);
}
