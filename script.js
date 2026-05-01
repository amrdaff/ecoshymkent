(() => {
  const supabaseUrl = "sb_publishable_ibANqJpuvkek6N7OYqVMZQ_Vp6q1aOr";
  const supabaseKey =
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZkeG5vaXJ6em1taHFleGhydHRuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzY4ODAyMTcsImV4cCI6MjA5MjQ1NjIxN30.4J6xKeQrj-OK34FaCdEHAsbgnONxv-JV8XUrgyhr4v4";

  const sb =
    window.supabase && typeof window.supabase.createClient === "function"
      ? window.supabase.createClient(supabaseUrl, supabaseKey)
      : null;

  const menuBtn = document.getElementById("menuBtn");
  const siteNav = document.getElementById("siteNav");
  const reportForm = document.getElementById("reportForm");
  const reportList = document.getElementById("reportList");
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

  if (menuBtn && siteNav) {
    menuBtn.addEventListener("click", () => {
      siteNav.classList.toggle("open");
    });

    siteNav.querySelectorAll("a").forEach((link) => {
      link.addEventListener("click", () => siteNav.classList.remove("open"));
    });
  }

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

  async function fetchReports() {
    if (!sb) return [];

    const { data, error } = await sb
      .from("reports")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Ошибка загрузки отчетов:", error.message);
      return [];
    }
    return data || [];
  }

  async function updateReportStatus(reportId, newStatus) {
    if (!sb) return;
    const { error } = await sb
      .from("reports")
      .update({ status: newStatus })
      .eq("id", reportId);

    if (error) {
      console.error("Ошибка обновления статуса:", error.message);
      alert("Не удалось обновить статус.");
    }
  }

  async function addComment(reportId, text) {
    if (!sb) return;
    const commentText = (text || "").trim();
    if (!commentText) return;

    const { data: userData } = await sb.auth.getUser();
    const author = userData?.user?.user_metadata?.full_name || "Anonymous";

    const { data: reportRow, error: getErr } = await sb
      .from("reports")
      .select("comments")
      .eq("id", reportId)
      .single();

    if (getErr) {
      console.error("Ошибка чтения комментариев:", getErr.message);
      alert("Не удалось добавить комментарий.");
      return;
    }

    const currentComments = Array.isArray(reportRow?.comments) ? reportRow.comments : [];
    const updatedComments = [...currentComments, { author, text: commentText }];

    const { error: updErr } = await sb
      .from("reports")
      .update({ comments: updatedComments })
      .eq("id", reportId);

    if (updErr) {
      console.error("Ошибка сохранения комментария:", updErr.message);
      alert("Не удалось сохранить комментарий.");
    }
  }

  function renderReportList(reports) {
    if (!reportList) return;
    reportList.innerHTML = "";

    if (!reports.length) {
      reportList.innerHTML = "<li>No reports yet. Be the first to add one.</li>";
      return;
    }

    reports.forEach((report) => {
      const item = document.createElement("li");
      item.className = "report-item";

      const status = report.status || "open";
      const statusClass =
        status === "completed" ? "status-completed" :
        status === "in_progress" ? "status-progress" :
        "status-open";

      const comments = Array.isArray(report.comments) ? report.comments : [];
      const commentsHtml = comments.length
        ? comments
            .map((comment) => `<li><strong>${comment.author || "Anonymous"}:</strong> ${comment.text || ""}</li>`)
            .join("")
        : "<li>No comments yet.</li>";

      item.innerHTML = `
        <strong>${report.location || "Unknown location"}</strong>
        <p>${report.address || ""}</p>
        <p>${report.description || ""}</p>
        ${report.photo ? `<img class="report-media" src="${report.photo}" alt="Report photo">` : ""}
        <div class="report-meta">
          <span class="badge">By: ${report.reporter || "Anonymous"}</span>
          <span class="badge ${statusClass}">Status: ${String(status).replace("_", " ")}</span>
        </div>
        <div class="report-actions">
          <label>
            <span class="badge">Update status</span>
            <select class="status-select" data-id="${report.id}">
              <option value="open" ${status === "open" ? "selected" : ""}>Open</option>
              <option value="in_progress" ${status === "in_progress" ? "selected" : ""}>In progress</option>
              <option value="completed" ${status === "completed" ? "selected" : ""}>Completed</option>
            </select>
          </label>
        </div>
        <ul class="comment-list">${commentsHtml}</ul>
        <form class="comment-form" data-id="${report.id}">
          <input type="text" placeholder="Add comment..." required />
          <button class="btn btn-ghost small" type="submit">Send</button>
        </form>
      `;

      reportList.appendChild(item);
    });

    reportList.querySelectorAll(".status-select").forEach((select) => {
      select.addEventListener("change", async () => {
        const reportId = Number(select.dataset.id);
        await updateReportStatus(reportId, select.value);
        await renderReports();
        await renderAchievements();
      });
    });

    reportList.querySelectorAll(".comment-form").forEach((form) => {
      form.addEventListener("submit", async (event) => {
        event.preventDefault();
        const reportId = Number(form.dataset.id);
        const input = form.querySelector("input");
        const text = input ? input.value : "";
        await addComment(reportId, text);
        await renderReports();
      });
    });
  }

  async function renderReports() {
    if (!reportList) return;
    if (!sb) {
      reportList.innerHTML = "<li>Supabase client is not initialized.</li>";
      return;
    }
    const reports = await fetchReports();
    renderReportList(reports);
  }

  async function renderAchievements() {
    if (!topContributors || !achievementSummary) return;
    if (!sb) {
      topContributors.innerHTML = "<li>No contributors yet.</li>";
      achievementSummary.textContent = "No activity yet.";
      return;
    }

    const reports = await fetchReports();
    const stats = {};
    let completedCount = 0;

    reports.forEach((report) => {
      const name = report.reporter || "Anonymous";
      stats[name] = (stats[name] || 0) + 1;
      if (report.status === "completed") completedCount += 1;
    });

    const leaders = Object.entries(stats)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);

    topContributors.innerHTML = leaders.length
      ? leaders.map(([name, count]) => `<li>${name} - ${count} report(s)</li>`).join("")
      : "<li>No contributors yet.</li>";

    achievementSummary.textContent = `Total reports: ${reports.length}. Completed: ${completedCount}. Open/In progress: ${reports.length - completedCount}.`;
  }

  if (reportForm) {
    reportForm.addEventListener("submit", async (event) => {
      event.preventDefault();
      if (!sb) {
        alert("Supabase is not initialized.");
        return;
      }

      const locationInput = document.getElementById("locationName");
      const addressInput = document.getElementById("locationAddress");
      const descInput = document.getElementById("locationDesc");
      const photoInput = document.getElementById("locationPhoto");
      const reporterInput = document.getElementById("reporterName");

      const saveReport = async (photoData) => {
        const { data: userData } = await sb.auth.getUser();
        const fallbackReporter =
          userData?.user?.user_metadata?.full_name || "Anonymous";

        const payload = {
          location: (locationInput?.value || "").trim(),
          address: (addressInput?.value || "").trim(),
          description: (descInput?.value || "").trim(),
          reporter: (reporterInput?.value || "").trim() || fallbackReporter,
          status: "open",
          photo: photoData || "",
          comments: [],
        };

        const { error } = await sb.from("reports").insert([payload]);

        if (error) {
          alert("Ошибка при сохранении: " + error.message);
          return;
        }

        reportForm.reset();
        await renderReports();
        await renderAchievements();
      };

      const file = photoInput && photoInput.files ? photoInput.files[0] : null;
      if (file) {
        const reader = new FileReader();
        reader.onload = () => saveReport(reader.result);
        reader.readAsDataURL(file);
      } else {
        await saveReport("");
      }
    });
  }

  initMap();
  renderPlaces();
  renderReports();
  renderAchievements();
})();
