const supabaseUrl = 'ТВОЙ_SUPABASE_URL';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZkeG5vaXJ6em1taHFleGhydHRuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzY4ODAyMTcsImV4cCI6MjA5MjQ1NjIxN30.4J6xKeQrj-OK34FaCdEHAsbgnONxv-JV8XUrgyhr4v4';
const supabase = window.supabase.createClient(supabaseUrl, supabaseKey);

const menuBtn = document.getElementById("menuBtn");
const siteNav = document.getElementById("siteNav");

if (menuBtn && siteNav) {
  menuBtn.addEventListener("click", () => {
    siteNav.classList.toggle("open");
  });

  siteNav.querySelectorAll("a").forEach((link) => {
    link.addEventListener("click", () => siteNav.classList.remove("open"));
  });
}

const reportForm = document.getElementById("reportForm");
const reportList = document.getElementById("reportList");
const storageKey = "shymkent_pollution_reports";
const currentUserKey = "ecoshymkent_current_user";
const placesList = document.getElementById("placesList");
const topContributors = document.getElementById("topContributors");
const achievementSummary = document.getElementById("achievementSummary");

const shymkentPlaces = [
  { name: "Secondary Raw Materials Point", address: "56 Kaldaiakov Street, Shymkent", lat: 42.3168, lng: 69.5964 },
  { name: "Korkem Plast Collection Point", address: "20B/7 Tamerlanovskoye Highway, Shymkent", lat: 42.363, lng: 69.528 },
  { name: "Makulatura Center (IP Ksemaks)", address: "117/1 Ilyaev Street, Shymkent", lat: 42.3125, lng: 69.5858 },
  { name: "Recycling Point (Yntymak)", address: "47/7 Yntymak, Shymkent", lat: 42.2896, lng: 69.5654 },
  { name: "Category DM Waste Utilization", address: "86 Gani Ilyaev Street, Shymkent", lat: 42.3118, lng: 69.5874 },
  { name: "KazMetalTrade", address: "26 Cement Plant Site, Shymkent", lat: 42.3532, lng: 69.5216 },
];

function initMap() {
  const mapRoot = document.getElementById("cityMap");
  if (!mapRoot || typeof L === "undefined") return;
  const map = L.map(mapRoot).setView([42.3417, 69.5901], 11);
  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    maxZoom: 18,
    attribution: "&copy; OpenStreetMap contributors",
  }).addTo(map);

  shymkentPlaces.forEach((place) => {
    L.marker([place.lat, place.lng])
      .addTo(map)
      .bindPopup(`<strong>${place.name}</strong><br>${place.address}`);
  });
}

function renderPlaces() {
  if (!placesList) return;
  placesList.innerHTML = "";
  shymkentPlaces.forEach((place) => {
    const item = document.createElement("li");
    item.textContent = `${place.name} - ${place.address}`;
    placesList.appendChild(item);
  });
}

async function renderReports() {
  if (!reportList) return;

  // Тянем отчеты из Supabase вместо localStorage
  const { data: reports, error } = await supabase
    .from('reports')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error("Ошибка загрузки:", error);
    return;
  }

  reportList.innerHTML = "";

  if (!reports || reports.length === 0) {
    reportList.innerHTML = "<li>No reports yet. Be the first to add one.</li>";
    return;
  }

  reports.forEach((report) => {
    const item = document.createElement("li");
    item.className = "report-item";
    const statusClass = report.status === "completed"
      ? "status-completed"
      : report.status === "in_progress"
        ? "status-progress"
        : "status-open";
        
    item.innerHTML = `
      <strong>${report.location}</strong>
      <p>${report.address}</p>
      <p>${report.description}</p>
      ${report.photo ? `<img class="report-media" src="${report.photo}" alt="Report photo">` : ""}
      <div class="report-meta">
        <span class="badge">By: ${report.reporter || "Anonymous"}</span>
        <span class="badge ${statusClass}">Status: ${report.status.replace("_", " ")}</span>
      </div>
    `;
    reportList.appendChild(item);
  });
}

  reports.forEach((report) => {
    const item = document.createElement("li");
    item.className = "report-item";
    const commentItems = (report.comments || [])
      .map((comment) => `<li><strong>${comment.author}:</strong> ${comment.text}</li>`)
      .join("");
    const statusClass = report.status === "completed"
      ? "status-completed"
      : report.status === "in_progress"
        ? "status-progress"
        : "status-open";
    item.innerHTML = `
      <strong>${report.location}</strong>
      <p>${report.address}</p>
      <p>${report.description}</p>
      ${report.photo ? `<img class="report-media" src="${report.photo}" alt="Report photo">` : ""}
      <div class="report-meta">
        <span class="badge">By: ${report.reporter || "Anonymous"}</span>
        <span class="badge ${statusClass}">Status: ${report.status.replace("_", " ")}</span>
      </div>
      <div class="report-actions">
        <label>
          <span class="badge">Update status</span>
          <select class="status-select" data-id="${report.id}">
            <option value="open" ${report.status === "open" ? "selected" : ""}>Open</option>
            <option value="in_progress" ${report.status === "in_progress" ? "selected" : ""}>In progress</option>
            <option value="completed" ${report.status === "completed" ? "selected" : ""}>Completed</option>
          </select>
        </label>
      </div>
      <ul class="comment-list">${commentItems || "<li>No comments yet.</li>"}</ul>
      <form class="comment-form" data-id="${report.id}">
        <input type="text" placeholder="Add comment..." required />
        <button class="btn btn-ghost small" type="submit">Send</button>
      </form>
    `;
    reportList.appendChild(item);
  });

  reportList.querySelectorAll(".status-select").forEach((select) => {
    select.addEventListener("change", () => {
      const reportsData = JSON.parse(localStorage.getItem(storageKey) || "[]");
      const target = reportsData.find((r) => r.id === Number(select.dataset.id));
      if (!target) return;
      target.status = select.value;
      localStorage.setItem(storageKey, JSON.stringify(reportsData));
      renderReports();
      renderAchievements();
    });
  });

  reportList.querySelectorAll(".comment-form").forEach((form) => {
    form.addEventListener("submit", (event) => {
      event.preventDefault();
      const reportsData = JSON.parse(localStorage.getItem(storageKey) || "[]");
      const target = reportsData.find((r) => r.id === Number(form.dataset.id));
      const input = form.querySelector("input");
      if (!target || !input.value.trim()) return;
      const currentUser = JSON.parse(localStorage.getItem(currentUserKey) || "null");
      target.comments = target.comments || [];
      target.comments.push({
        author: currentUser?.name || "Anonymous",
        text: input.value.trim(),
      });
      localStorage.setItem(storageKey, JSON.stringify(reportsData));
      renderReports();
    });
  });
}

function renderAchievements() {
  if (!topContributors || !achievementSummary) return;
  const reports = JSON.parse(localStorage.getItem(storageKey) || "[]");
  const stats = {};
  let completedCount = 0;
  reports.forEach((report) => {
    const name = report.reporter || "Anonymous";
    stats[name] = (stats[name] || 0) + 1;
    if (report.status === "completed") completedCount += 1;
  });
  const leaders = Object.entries(stats).sort((a, b) => b[1] - a[1]).slice(0, 5);
  topContributors.innerHTML = leaders.length
    ? leaders.map(([name, count]) => `<li>${name} - ${count} report(s)</li>`).join("")
    : "<li>No contributors yet.</li>";
  achievementSummary.textContent = `Total reports: ${reports.length}. Completed: ${completedCount}. Open/In progress: ${reports.length - completedCount}.`;
}

if (reportForm) {
  reportForm.addEventListener("submit", (event) => {
    event.preventDefault();

    const locationInput = document.getElementById("locationName");
    const addressInput = document.getElementById("locationAddress");
    const descInput = document.getElementById("locationDesc");
    const photoInput = document.getElementById("locationPhoto");
    const reporterInput = document.getElementById("reporterName");

    const saveReport = async (photoData) => {
      // 1. Получаем пользователя из Supabase
      const { data: { user } } = await supabase.auth.getUser();
      const fallbackReporter = user ? user.user_metadata.full_name : "Anonymous";

      // 2. Отправляем в базу
      const { data, error } = await supabase
        .from('reports')
        .insert([
          {
            location: locationInput.value.trim(),
            address: addressInput.value.trim(),
            description: descInput.value.trim(),
            reporter: reporterInput.value.trim() || fallbackReporter,
            status: "open",
            photo: photoData || ""
          }
        ]);

      if (error) {
        alert("Ошибка при сохранении: " + error.message);
      } else {
        reportForm.reset();
        renderReports(); 
        // renderAchievements(); // Временно закомментировали, так как она еще работает на localStorage
      }
    };
    const file = photoInput.files && photoInput.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => saveReport(reader.result);
      reader.readAsDataURL(file);
    } else {
      saveReport("");
    }
  });
}

initMap();
renderPlaces();
renderReports();
renderAchievements();
