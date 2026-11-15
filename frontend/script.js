// =====================================================
// CONFIG: change this to your Hugging Face Space URL after deploying the backend
const API_URL = "http://localhost:8000";
// =====================================================

const $ = (id) => document.getElementById(id);
const ALLOWED = ["image/jpeg", "image/png", "image/webp"];
const MAX_BYTES = 8 * 1024 * 1024;
const state = { content: null, style: null };
let resultUrl = null;

/* ---------- Toasts ---------- */
function toast(message, type = "info", ms = 6000) {
  const el = document.createElement("div");
  el.className = "toast " + type;
  el.textContent = message;
  $("toasts").appendChild(el);
  setTimeout(() => el.remove(), ms);
}

/* ---------- Range fill (teal track up to the thumb) ---------- */
function paintRange(input) {
  const pct = ((input.value - input.min) / (input.max - input.min)) * 100;
  input.style.setProperty("--p", pct + "%");
}

/* ---------- Rotating hero word ---------- */
(function rotateWord() {
  const words = ["sketched", "painted", "inked", "watercoloured"];
  let i = 0;
  setInterval(() => { i = (i + 1) % words.length; $("word").textContent = words[i]; }, 2200);
})();

/* ---------- File handling ---------- */
function updateButton() {
  $("go").disabled = !(state.content && state.style);
}

function takeFile(kind, file) {
  if (!file) return;
  if (!ALLOWED.includes(file.type)) {
    toast("Please choose a JPG, PNG or WEBP image.", "error"); return;
  }
  if (file.size > MAX_BYTES) {
    toast("File is too large. Maximum size is 8 MB.", "error"); return;
  }
  const img = $("prev-" + kind);
  if (img.src.startsWith("blob:")) URL.revokeObjectURL(img.src);
  state[kind] = file;
  img.src = URL.createObjectURL(file);
  img.hidden = false;
  $("hint-" + kind).hidden = true;
  $("name-" + kind).textContent = file.name;
  updateButton();
}

function setupDrop(kind) {
  const drop = $("drop-" + kind), input = $("file-" + kind);
  drop.addEventListener("click", () => input.click());
  input.addEventListener("change", () => { takeFile(kind, input.files[0]); input.value = ""; });
  ["dragenter", "dragover"].forEach((e) =>
    drop.addEventListener(e, (ev) => { ev.preventDefault(); drop.classList.add("over"); }));
  ["dragleave", "drop"].forEach((e) =>
    drop.addEventListener(e, (ev) => { ev.preventDefault(); drop.classList.remove("over"); }));
  drop.addEventListener("drop", (ev) => takeFile(kind, ev.dataTransfer.files[0]));
}
setupDrop("content");
setupDrop("style");

/* ---------- Strength slider ---------- */
$("strength").addEventListener("input", (e) => {
  $("strength-val").textContent = e.target.value + "%";
  paintRange(e.target);
});
paintRange($("strength"));

/* ---------- Style transfer ---------- */
async function transfer() {
  $("go").disabled = true;
  $("status").hidden = false;

  const fd = new FormData();
  fd.append("content", state.content);
  fd.append("style", state.style);
  fd.append("strength", (Number($("strength").value) / 100).toFixed(2));

  // Free Hugging Face Spaces sleep, so warn the user if it takes long
  const wake = setTimeout(
    () => toast("Server is waking up, this may take up to a minute...", "info", 12000), 8000);
  const ctrl = new AbortController();
  const timeout = setTimeout(() => ctrl.abort(), 180000);

  try {
    const res = await fetch(API_URL + "/stylize", { method: "POST", body: fd, signal: ctrl.signal });
    if (!res.ok) {
      let msg = "Server error (" + res.status + ")";
      try { const j = await res.json(); if (j.detail) msg = j.detail; } catch (_) {}
      throw new Error(msg);
    }
    showResult(await res.blob());
  } catch (err) {
    let msg = err.message;
    if (err.name === "AbortError") msg = "The request timed out. Please try again.";
    else if (msg === "Failed to fetch") msg = "Cannot reach the server. Is the backend running?";
    toast(msg, "error");
  } finally {
    clearTimeout(wake); clearTimeout(timeout);
    $("status").hidden = true;
    updateButton();
  }
}
$("go").addEventListener("click", transfer);

/* ---------- Result + before/after ---------- */
function showResult(blob) {
  if (resultUrl) URL.revokeObjectURL(resultUrl);
  resultUrl = URL.createObjectURL(blob);
  $("img-after").src = resultUrl;
  $("img-before").src = $("prev-content").src;
  $("download").href = resultUrl;
  $("slider").value = 50; setCompare(50);
  $("result").hidden = false;
  $("result").scrollIntoView({ behavior: "smooth", block: "start" });
}

function setCompare(v) {
  $("img-before").style.clipPath = "inset(0 " + (100 - v) + "% 0 0)";
  $("divider").style.left = v + "%";
  paintRange($("slider"));
}
$("slider").addEventListener("input", (e) => setCompare(e.target.value));

/* ---------- Reset ---------- */
$("reset").addEventListener("click", () => {
  ["content", "style"].forEach((k) => {
    state[k] = null;
    const img = $("prev-" + k);
    img.hidden = true; img.removeAttribute("src");
    $("hint-" + k).hidden = false;
    $("name-" + k).textContent = "No file chosen";
  });
  $("result").hidden = true;
  $("strength").value = 100; $("strength-val").textContent = "100%"; paintRange($("strength"));
  updateButton();
  $("studio").scrollIntoView({ behavior: "smooth" });
});

/* ---------- Contact form (demo only) ---------- */
$("contact-form").addEventListener("submit", (e) => {
  e.preventDefault(); e.target.reset();
  toast("Thanks! Your message was sent (demo).", "info");
});

/* =====================================================
   AUTH (demo): accounts live in this browser's localStorage.
   Passwords are hashed with SHA-256 (never stored as plain text).
   For a production app, replace this with a real backend or a
   service such as Firebase Auth or Supabase.
   ===================================================== */
const USERS_KEY = "atelier_users";
const SESSION_KEY = "atelier_session";
let authMode = "signin";

function readUsers() {
  try { return JSON.parse(localStorage.getItem(USERS_KEY)) || {}; } catch (_) { return {}; }
}
function writeUsers(users) {
  try { localStorage.setItem(USERS_KEY, JSON.stringify(users)); return true; } catch (_) { return false; }
}
function currentUser() {
  try {
    const email = localStorage.getItem(SESSION_KEY);
    return email ? { email, ...(readUsers()[email] || {}) } : null;
  } catch (_) { return null; }
}
async function sha256(text) {
  if (!window.crypto || !crypto.subtle) throw new Error("Secure hashing is unavailable. Open the site on localhost or https.");
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(text));
  return Array.from(new Uint8Array(buf)).map((b) => b.toString(16).padStart(2, "0")).join("");
}

function renderAuth() {
  const area = $("auth-area");
  area.replaceChildren();
  const user = currentUser();
  if (user && user.name) {
    const hello = document.createElement("span");
    hello.className = "hello";
    hello.append("Hi, ");
    const b = document.createElement("b");
    b.textContent = user.name;
    hello.appendChild(b);
    const out = document.createElement("button");
    out.className = "btn-outline"; out.type = "button"; out.textContent = "Sign out";
    out.addEventListener("click", () => {
      try { localStorage.removeItem(SESSION_KEY); } catch (_) {}
      renderAuth(); toast("You have been signed out.");
    });
    area.append(hello, out);
  } else {
    const btn = document.createElement("button");
    btn.className = "btn-outline"; btn.type = "button"; btn.textContent = "Sign In";
    btn.addEventListener("click", () => openModal("signin"));
    area.appendChild(btn);
  }
}

function setMode(mode) {
  authMode = mode;
  const up = mode === "signup";
  $("tab-signin").classList.toggle("active", !up);
  $("tab-signup").classList.toggle("active", up);
  $("auth-name").hidden = !up;
  $("auth-name").required = up;
  $("auth-submit").textContent = up ? "Create account" : "Sign in";
  $("modal-title").textContent = up ? "Join Atelier" : "Welcome back";
  $("auth-pass").autocomplete = up ? "new-password" : "current-password";
  $("auth-error").hidden = true;
}
function openModal(mode) {
  setMode(mode);
  $("modal").hidden = false;
  setTimeout(() => (mode === "signup" ? $("auth-name") : $("auth-email")).focus(), 50);
}
function closeModal() {
  $("modal").hidden = true;
  $("auth-form").reset();
  $("auth-error").hidden = true;
}
function authError(msg) {
  $("auth-error").textContent = msg;
  $("auth-error").hidden = false;
}

$("tab-signin").addEventListener("click", () => setMode("signin"));
$("tab-signup").addEventListener("click", () => setMode("signup"));
$("modal-close").addEventListener("click", closeModal);
$("modal").addEventListener("click", (e) => { if (e.target === $("modal")) closeModal(); });
document.addEventListener("keydown", (e) => { if (e.key === "Escape" && !$("modal").hidden) closeModal(); });

$("auth-form").addEventListener("submit", async (e) => {
  e.preventDefault();
  const email = $("auth-email").value.trim().toLowerCase();
  const pass = $("auth-pass").value;
  const name = $("auth-name").value.trim();
  if (pass.length < 6) return authError("Password must be at least 6 characters.");

  try {
    const users = readUsers();
    const hash = await sha256(email + ":" + pass);

    if (authMode === "signup") {
      if (!name) return authError("Please enter your name.");
      if (users[email]) return authError("An account with this email already exists. Try signing in.");
      users[email] = { name, hash };
      if (!writeUsers(users)) return authError("Could not save the account in this browser.");
      localStorage.setItem(SESSION_KEY, email);
      toast("Account created. Welcome, " + name + "!");
    } else {
      if (!users[email] || users[email].hash !== hash) return authError("Incorrect email or password.");
      localStorage.setItem(SESSION_KEY, email);
      toast("Welcome back, " + users[email].name + "!");
    }
    closeModal();
    renderAuth();
  } catch (err) {
    authError(err.message || "Something went wrong. Please try again.");
  }
});

renderAuth();
