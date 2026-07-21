/**
 * login.js
 * Digital Forensic Medical Information System
 * Handles login form logic with hardcoded credentials (UI demo phase)
 */

// ── Hardcoded accounts (replace with API call when backend is ready) ──
const ACCOUNTS = [
  { username: "admin",  password: "admin123",  redirect: "pages/admin.html",      role: "Administrator" },
  { username: "staff",  password: "staff123",  redirect: "pages/staff.html",      role: "Forensic Staff" },
  { username: "police", password: "police123", redirect: "pages/police/police.html", role: "Police Officer" },
  { username: "jmo",    password: "jmo123",    redirect: "pages/jmo/jmo.html",    role: "Judicial Medical Officer" },
  { username: "lab",    password: "lab123",    redirect: "pages/laboratory.html", role: "Laboratory Technician" },
];

// ── DOM references ────────────────────────────────────────────────────
const usernameInput = document.getElementById("username");
const passwordInput = document.getElementById("password");
const loginAlert   = document.getElementById("loginAlert");
const loginForm    = document.getElementById("loginForm");



// ── Checkbox: Show Password ────────────────────────────────────────────
document.addEventListener("DOMContentLoaded", () => {
  const showPwCb = document.getElementById("showPassword");
  if (showPwCb) {
    showPwCb.addEventListener("change", () => {
      passwordInput.type = showPwCb.checked ? "text" : "password";
    });
  }

  // Live clock in login footer
  updateClock();
  setInterval(updateClock, 1000);
});

function updateClock() {
  const el = document.getElementById("loginClock");
  if (!el) return;
  el.textContent = new Date().toLocaleString("en-US", {
    weekday: "short", year: "numeric", month: "short",
    day: "numeric", hour: "2-digit", minute: "2-digit"
  });
}

// ── Show error alert ───────────────────────────────────────────────────
function showAlert(message) {
  loginAlert.textContent = "⚠ " + message;
  loginAlert.classList.add("show", "error");
  // Re-trigger animation
  loginAlert.style.animation = "none";
  loginAlert.offsetHeight; // reflow
  loginAlert.style.animation = "";
  setTimeout(() => loginAlert.classList.remove("show", "error"), 4000);
}

// ── Main login function ────────────────────────────────────────────────
function login() {
  const username = usernameInput.value.trim().toLowerCase();
  const password = passwordInput.value;

  // Basic validation
  if (!username) { showAlert("Please enter your username."); usernameInput.focus(); return; }
  if (!password) { showAlert("Please enter your password."); passwordInput.focus(); return; }

  // Match credentials
  const match = ACCOUNTS.find(a => a.username === username && a.password === password);

  if (match) {
    // If it's Forensic Staff, attempt real backend authentication
    if (match.role === "Forensic Staff") {
      const btn = document.getElementById("loginBtn");
      btn.textContent = "Authenticating…";
      btn.disabled = true;
      fetch('http://localhost:5000/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ username, password })
      }).then(res => res.json()).then(data => {
          if (data.token) {
              sessionStorage.setItem("jwt_token", data.token);
              sessionStorage.setItem("loggedIn", "true");
              sessionStorage.setItem("username", match.username);
              sessionStorage.setItem("role", match.role);
              setTimeout(() => { window.location.href = match.redirect; }, 600);
          } else {
              btn.textContent = "Login";
              btn.disabled = false;
              showAlert(data.error || "Invalid username or password.");
          }
      }).catch(err => {
          btn.textContent = "Login";
          btn.disabled = false;
          showAlert("Server error. Please check if backend is running.");
      });
      return;
    }

    // Store session info (session storage — cleared on tab close)
    sessionStorage.setItem("loggedIn", "true");
    sessionStorage.setItem("username", match.username);
    sessionStorage.setItem("role", match.role);

    // Brief loading feedback
    const btn = document.getElementById("loginBtn");
    btn.textContent = "Authenticating…";
    btn.disabled = true;

    setTimeout(() => { window.location.href = match.redirect; }, 600);
  } else {
    showAlert("Invalid username or password. Please try again.");
    passwordInput.value = "";
    passwordInput.focus();
  }
}

// ── Fill demo credentials ──────────────────────────────────────────────
function fillDemo(username, password) {
  usernameInput.value = username;
  passwordInput.value = password;
  usernameInput.focus();

  // Subtle flash on inputs
  [usernameInput, passwordInput].forEach(el => {
    el.style.borderColor = "#0F4C81";
    setTimeout(() => el.style.borderColor = "", 800);
  });
}

// ── Enter key triggers login ───────────────────────────────────────────
document.addEventListener("keydown", (e) => {
  if (e.key === "Enter" && document.activeElement !== document.getElementById("loginBtn")) {
    login();
  }
});

// ── Continue as guest ──────────────────────────────────────────────────
function continueAsGuest() {
  sessionStorage.setItem("guest", "true");
  window.location.href = "pages/public.html";
}
