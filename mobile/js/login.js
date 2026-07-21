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
async function login() {
  const username = usernameInput.value.trim().toLowerCase();
  const password = passwordInput.value;

  // Basic validation
  if (!username) { showAlert("Please enter your username."); usernameInput.focus(); return; }
  if (!password) { showAlert("Please enter your password."); passwordInput.focus(); return; }

  const btn = document.getElementById("loginBtn");
  const originalText = btn.textContent;
  btn.textContent = "Authenticating…";
  btn.disabled = true;

  try {
    const API_URL = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
      ? 'http://localhost:5000'
      : 'https://forensic-website.azurewebsites.net';

    const response = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ username, password })
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Invalid username or password');
    }

    const data = await response.json();
    
    // Store session info (session storage — cleared on tab close)
    sessionStorage.setItem("loggedIn", "true");
    sessionStorage.setItem("token", data.token);
    sessionStorage.setItem("username", data.profile.username);
    
    // Determine user role and redirect
    const userRole = data.roles[0]; // e.g. 'ADMIN', 'FORENSIC_STAFF', 'POLICE', 'JMO', 'LAB_TECHNICIAN'
    
    let redirect = "pages/public.html";
    let friendlyRole = "Guest";
    
    if (userRole === "ADMIN") {
      redirect = "pages/admin.html";
      friendlyRole = "Administrator";
    } else if (userRole === "FORENSIC_STAFF") {
      redirect = "pages/staff.html";
      friendlyRole = "Forensic Staff";
    } else if (userRole === "POLICE") {
      redirect = "pages/police/police.html";
      friendlyRole = "Police Officer";
    } else if (userRole === "JMO") {
      redirect = "pages/jmo/jmo.html";
      friendlyRole = "Judicial Medical Officer";
    } else if (userRole === "LAB_TECHNICIAN") {
      redirect = "pages/laboratory.html";
      friendlyRole = "Laboratory Technician";
    }
    
    sessionStorage.setItem("role", friendlyRole);
    sessionStorage.setItem("raw_role", userRole);

    setTimeout(() => { window.location.href = redirect; }, 600);
  } catch (error) {
    showAlert(error.message || "Connection error. Please try again.");
    btn.textContent = originalText;
    btn.disabled = false;
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
