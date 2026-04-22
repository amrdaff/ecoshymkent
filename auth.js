const usersKey = "ecoshymkent_users";
const currentUserKey = "ecoshymkent_current_user";

function getUsers() {
  return JSON.parse(localStorage.getItem(usersKey) || "[]");
}

function setUsers(users) {
  localStorage.setItem(usersKey, JSON.stringify(users));
}

function isValidEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function setMessage(el, text, isSuccess = false) {
  if (!el) return;
  el.textContent = text;
  el.classList.toggle("success", isSuccess);
}

document.querySelectorAll(".toggle-pass").forEach((button) => {
  button.addEventListener("click", () => {
    const input = document.getElementById(button.dataset.target);
    if (!input) return;
    const isPassword = input.type === "password";
    input.type = isPassword ? "text" : "password";
    button.textContent = isPassword ? "Hide" : "Show";
  });
});

const registerForm = document.getElementById("registerForm");
if (registerForm) {
  registerForm.addEventListener("submit", (event) => {
    event.preventDefault();
    const name = document.getElementById("regName").value.trim();
    const email = document.getElementById("regEmail").value.trim().toLowerCase();
    const password = document.getElementById("regPassword").value.trim();
    const confirm = document.getElementById("regPasswordConfirm").value.trim();
    const msg = document.getElementById("registerMessage");
    setMessage(msg, "");

    if (name.length < 2) {
      setMessage(msg, "Please enter your full name.");
      return;
    }
    if (!isValidEmail(email)) {
      setMessage(msg, "Please enter a valid email address.");
      return;
    }
    if (password.length < 6) {
      setMessage(msg, "Password must be at least 6 characters.");
      return;
    }
    if (password !== confirm) {
      setMessage(msg, "Passwords do not match.");
      return;
    }

    const users = getUsers();
    const exists = users.some((user) => user.email === email);
    if (exists) {
      setMessage(msg, "This email is already registered.");
      return;
    }

    users.push({ name, email, password });
    setUsers(users);
    localStorage.setItem(currentUserKey, JSON.stringify({ name, email }));
    setMessage(msg, "Account created successfully. Redirecting...", true);
    window.location.href = "profile.html";
  });
}

const loginForm = document.getElementById("loginForm");
if (loginForm) {
  loginForm.addEventListener("submit", (event) => {
    event.preventDefault();
    const email = document.getElementById("loginEmail").value.trim().toLowerCase();
    const password = document.getElementById("loginPassword").value.trim();
    const msg = document.getElementById("loginMessage");
    setMessage(msg, "");
    if (!isValidEmail(email)) {
      setMessage(msg, "Please enter a valid email address.");
      return;
    }
    const users = getUsers();

    const user = users.find((item) => item.email === email && item.password === password);
    if (!user) {
      setMessage(msg, "Invalid email or password.");
      return;
    }

    localStorage.setItem(currentUserKey, JSON.stringify({ name: user.name, email: user.email }));
    setMessage(msg, "Login successful. Redirecting...", true);
    window.location.href = "profile.html";
  });
}

const profileContent = document.getElementById("profileContent");
if (profileContent) {
  const current = JSON.parse(localStorage.getItem(currentUserKey) || "null");
  if (!current) {
    window.location.href = "login.html";
  } else {
    profileContent.innerHTML = `
      <p><strong>Name:</strong> ${current.name}</p>
      <p><strong>Email:</strong> ${current.email}</p>
      <p>Your account can submit community pollution reports.</p>
    `;
  }

  const logoutBtn = document.getElementById("logoutBtn");
  logoutBtn?.addEventListener("click", () => {
    localStorage.removeItem(currentUserKey);
    window.location.href = "login.html";
  });
}
