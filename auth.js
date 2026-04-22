// === 1. ИНИЦИАЛИЗАЦИЯ SUPABASE ===
const supabaseUrl = 'https://fdxnoirzzmmhqexhrttn.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZkeG5vaXJ6em1taHFleGhydHRuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzY4ODAyMTcsImV4cCI6MjA5MjQ1NjIxN30.4J6xKeQrj-OK34FaCdEHAsbgnONxv-JV8XUrgyhr4v4';
const supabase = window.supabase.createClient(supabaseUrl, supabaseKey);

// Вспомогательные функции
function isValidEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function setMessage(el, text, isSuccess = false) {
  if (!el) return;
  el.textContent = text;
  el.style.color = isSuccess ? "green" : "red";
}

// Кнопка показа пароля
document.querySelectorAll(".toggle-pass").forEach((button) => {
  button.addEventListener("click", () => {
    const input = document.getElementById(button.dataset.target);
    if (!input) return;
    const isPassword = input.type === "password";
    input.type = isPassword ? "text" : "password";
    button.textContent = isPassword ? "Hide" : "Show";
  });
});

// === 2. РЕГИСТРАЦИЯ ===
const registerForm = document.getElementById("registerForm");
if (registerForm) {
  registerForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    const name = document.getElementById("regName").value.trim();
    const email = document.getElementById("regEmail").value.trim().toLowerCase();
    const password = document.getElementById("regPassword").value.trim();
    const confirm = document.getElementById("regPasswordConfirm").value.trim();
    const msg = document.getElementById("registerMessage");
    
    setMessage(msg, "Загрузка...");

    if (name.length < 2) return setMessage(msg, "Please enter your full name.");
    if (!isValidEmail(email)) return setMessage(msg, "Please enter a valid email address.");
    if (password.length < 6) return setMessage(msg, "Password must be at least 6 characters.");
    if (password !== confirm) return setMessage(msg, "Passwords do not match.");

    const { data, error } = await supabase.auth.signUp({
      email: email,
      password: password,
      options: {
        data: { full_name: name }
      }
    });

    if (error) {
      setMessage(msg, "Error: " + error.message);
    } else {
      setMessage(msg, "Success! Check your email or try to login.", true);
      setTimeout(() => { window.location.href = "login.html"; }, 2000);
    }
  });
}

// === 3. ЛОГИН ===
const loginForm = document.getElementById("loginForm");
if (loginForm) {
  loginForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    const email = document.getElementById("loginEmail").value.trim().toLowerCase();
    const password = document.getElementById("loginPassword").value.trim();
    const msg = document.getElementById("loginMessage");
    
    setMessage(msg, "Загрузка...");

    const { data, error } = await supabase.auth.signInWithPassword({
      email: email,
      password: password,
    });

    if (error) {
      setMessage(msg, "Invalid email or password.");
    } else {
      setMessage(msg, "Login successful. Redirecting...", true);
      setTimeout(() => { window.location.href = "profile.html"; }, 1000);
    }
  });
}

// === 4. ПРОФИЛЬ И ВЫХОД ===
const profileContent = document.getElementById("profileContent");
if (profileContent) {
  async function loadProfile() {
    const { data: { user }, error } = await supabase.auth.getUser();

    if (error || !user) {
      window.location.href = "login.html";
    } else {
      const userName = user.user_metadata.full_name || "User";
      profileContent.innerHTML = `
        <p><strong>Name:</strong> ${userName}</p>
        <p><strong>Email:</strong> ${user.email}</p>
        <p>Your account is active. Now you can submit reports!</p>
      `;
    }
  }
  loadProfile();
}

const logoutBtn = document.getElementById("logoutBtn");
if (logoutBtn) {
  logoutBtn.addEventListener("click", async () => {
    await supabase.auth.signOut();
    window.location.href = "login.html";
  });
}
