// === 1. ИНИЦИАЛИЗАЦИЯ SUPABASE ===
// Вставь сюда свои ключи из настроек проекта Supabase
const supabaseUrl = 'ТВОЙ_SUPABASE_URL';
const supabaseKey = 'ТВОЙ_SUPABASE_ANON_KEY';
const supabase = window.supabase.createClient(supabaseUrl, supabaseKey);

// Вспомогательные функции (оставляем как было)
function isValidEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function setMessage(el, text, isSuccess = false) {
  if (!el) return;
  el.textContent = text;
  el.classList.toggle("success", isSuccess);
}

// Кнопка показа пароля (оставляем без изменений)
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
    
    setMessage(msg, "Загрузка..."); // Даем пользователю понять, что пошел запрос

    if (name.length < 2) return setMessage(msg, "Please enter your full name.");
    if (!isValidEmail(email)) return setMessage(msg, "Please enter a valid email address.");
    if (password.length < 6) return setMessage(msg, "Password must be at least 6 characters.");
    if (password !== confirm) return setMessage(msg, "Passwords do not match.");

    // Отправляем данные в базу Supabase
    const { data, error } = await supabase.auth.signUp({
      email: email,
      password: password,
      options: {
        data: { full_name: name } // Записываем имя в профиль пользователя
      }
    });

    if (error) {
      // Если email уже занят или пароль слишком простой
      setMessage(msg, "Error: " + error.message);
    } else {
      setMessage(msg, "Account created successfully. Redirecting...", true);
      // Supabase автоматически создает сессию, поэтому перенаправляем в профиль
      setTimeout(() => { window.location.href = "profile.html"; }, 1000);
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

    if (!isValidEmail(email)) return setMessage(msg, "Please enter a valid email address.");

    // Проверяем почту и пароль через Supabase
    const { data, error } = await supabase.auth.signInWithPassword({
      email: email,
      password: password,
    });

    if (error) {
      setMessage(msg, "Invalid email or password.");
    } else {
      setMessage(msg, "Login successful. Redirecting...", true);
      window.location.href = "profile.html";
    }
  });
}

// === 4. ПРОФИЛЬ И ВЫХОД ===
const profileContent = document.getElementById("profileContent");
if (profileContent) {
  
  // Создаем функцию для асинхронного получения данных пользователя
  async function loadProfile() {
    // Получаем текущего пользователя из защищенной сессии
    const { data: { user }, error } = await supabase.auth.getUser();

    if (error || !user) {
      // Если сессии нет - выкидываем на логин
      window.location.href = "login.html";
    } else {
      // Достаем имя (оно хранится в user_metadata, куда мы его положили при регистрации)
      const userName = user.user_metadata.full_name || "User";
      profileContent.innerHTML = `
        <p><strong>Name:</strong> ${userName}</p>
        <p><strong>Email:</strong> ${user.email}</p>
        <p>Your account can submit community pollution reports.</p>
      `;
    }
  }

  loadProfile();

  // Выход (Logout)
  const logoutBtn = document.getElementById("logoutBtn");
  logoutBtn?.addEventListener("click", async () => {
    await supabase.auth.signOut(); // Уничтожаем сессию на сервере
    window.location.href = "login.html"; // Перекидываем на вход
  });
}
