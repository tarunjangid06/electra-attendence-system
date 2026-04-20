// ─── WORKSHOP LOCATION ───────────────────────────────────────────────
// ⚠️ UPDATE these coordinates to your actual workshop location
const WORKSHOP = { lat: 26.92870363803506, lng: 75.70057698074936, radius: 100 }; // radius in meters
// ─────────────────────────────────────────────────────────────────────

const USERS = [
  { id: "admin",   pass: "admin123",  name: "Admin",         role: "Administrator", isAdmin: true },
  { id: "worker1", pass: "pass1",     name: "Ahmed Khan",    role: "Welder" },
  { id: "worker2", pass: "pass2",     name: "Ali Hassan",    role: "Mechanic" },
  { id: "worker3", pass: "pass3",     name: "Bilal Raza",    role: "Electrician" },
  { id: "worker4", pass: "pass4",     name: "Usman Tariq",   role: "Painter" },
  { id: "worker5", pass: "pass5",     name: "Kamran Malik",  role: "Welder" },
  { id: "worker6", pass: "pass6",     name: "Zubair Ahmed",  role: "Mechanic" },
  { id: "worker7", pass: "pass7",     name: "Faisal Iqbal",  role: "Helper" },
  { id: "worker8", pass: "pass8",     name: "Imran Siddiq",  role: "Electrician" },
  { id: "worker9", pass: "pass9",     name: "Tariq Mehmood", role: "Painter" },
  { id: "worker10",pass: "pass10",    name: "Nasir Javed",   role: "Welder" },
  { id: "worker11",pass: "pass11",    name: "Shahid Butt",   role: "Helper" },
  { id: "worker12",pass: "pass12",    name: "Rizwan Qureshi",role: "Mechanic" },
  { id: "worker13",pass: "pass13",    name: "Hamid Nawaz",   role: "Electrician" },
  { id: "worker14",pass: "pass14",    name: "Sajid Hussain", role: "Helper" },
  { id: "worker15",pass: "pass15",    name: "Waqar Anwar",   role: "Welder" },
];

let currentUser = null;

// ─── HELPERS ─────────────────────────────────────────────────────────
function today() { return new Date().toISOString().split("T")[0]; }
function nowTime() { return new Date().toLocaleTimeString("en-PK", { hour: "2-digit", minute: "2-digit" }); }
function fmtDate(d) { return new Date(d).toLocaleDateString("en-PK", { day: "2-digit", month: "short", year: "numeric" }); }

function getRecords(uid) { return JSON.parse(localStorage.getItem("att_" + uid) || "[]"); }
function saveRecords(uid, data) { localStorage.setItem("att_" + uid, JSON.stringify(data)); }

function showPage(id) {
  document.querySelectorAll(".page").forEach(p => p.classList.remove("active"));
  document.getElementById(id).style.display = "block";
  document.getElementById(id).classList.add("active");
}

function haversine(lat1, lng1, lat2, lng2) {
  const R = 6371000, dLat = (lat2 - lat1) * Math.PI / 180, dLng = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(dLat/2)**2 + Math.cos(lat1*Math.PI/180) * Math.cos(lat2*Math.PI/180) * Math.sin(dLng/2)**2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
}

// ─── AUTH ─────────────────────────────────────────────────────────────
function login() {
  const uid = document.getElementById("loginUser").value.trim();
  const pwd = document.getElementById("loginPass").value.trim();
  const user = USERS.find(u => u.id === uid && u.pass === pwd);
  if (!user) { document.getElementById("loginError").textContent = "Invalid username or password."; return; }
  currentUser = user;
  document.getElementById("loginError").textContent = "";
  document.getElementById("loginUser").value = "";
  document.getElementById("loginPass").value = "";
  if (user.isAdmin) { showPage("adminPage"); renderAdmin(); }
  else { showPage("workerPage"); renderWorker(); }
}

function logout() {
  currentUser = null;
  showPage("loginPage");
  document.getElementById("loginPage").style.display = "flex";
}

// ─── WORKER DASHBOARD ────────────────────────────────────────────────
function renderWorker() {
  const u = currentUser;
  document.getElementById("navName").textContent = u.name;
  document.getElementById("workerName").textContent = u.name;
  document.getElementById("workerRole").textContent = u.role;
  document.getElementById("workerAvatar").textContent = u.name.charAt(0);

  const records = getRecords(u.id);
  const todayRec = records.find(r => r.date === today());
  const thisMonth = new Date().toISOString().slice(0, 7);

  document.getElementById("totalDays").textContent = records.filter(r => r.checkIn).length;
  document.getElementById("presentMonth").textContent = records.filter(r => r.date.startsWith(thisMonth) && r.checkIn).length;

  const btn = document.getElementById("checkBtn");
  if (todayRec?.checkOut) {
    document.getElementById("todayStatus").textContent = "✅";
    btn.textContent = "✅ Done for Today";
    btn.disabled = true;
    btn.classList.remove("checkout");
  } else if (todayRec?.checkIn) {
    document.getElementById("todayStatus").textContent = "IN";
    btn.textContent = "🚪 Check Out";
    btn.disabled = false;
    btn.classList.add("checkout");
  } else {
    document.getElementById("todayStatus").textContent = "—";
    btn.textContent = "📍 Check In";
    btn.disabled = false;
    btn.classList.remove("checkout");
  }

  renderTable(records);
}

function renderTable(records) {
  const tbody = document.getElementById("attendanceTable");
  const sorted = [...records].sort((a, b) => b.date.localeCompare(a.date));
  tbody.innerHTML = sorted.length ? sorted.map((r, i) => `
    <tr>
      <td>${i + 1}</td>
      <td>${fmtDate(r.date)}</td>
      <td>${r.checkIn || "—"}</td>
      <td>${r.checkOut || "—"}</td>
      <td><span class="badge ${r.checkOut ? 'present' : r.checkIn ? 'partial' : 'absent'}">${r.checkOut ? "Complete" : r.checkIn ? "Checked In" : "Absent"}</span></td>
    </tr>`).join("") : `<tr><td colspan="5" style="text-align:center;color:#aaa;padding:20px">No records yet</td></tr>`;
}

// ─── GEOLOCATION + CHECK IN/OUT ──────────────────────────────────────
function handleCheckIn() {
  const msg = document.getElementById("checkMsg");
  const locStatus = document.getElementById("locationStatus");
  msg.textContent = "📡 Getting your location...";
  locStatus.textContent = "";

  if (!navigator.geolocation) {
    msg.textContent = "❌ Geolocation not supported by your browser.";
    return;
  }

  navigator.geolocation.getCurrentPosition(
    pos => {
      const dist = haversine(pos.coords.latitude, pos.coords.longitude, WORKSHOP.lat, WORKSHOP.lng);
      locStatus.textContent = `📍 Distance from workshop: ${Math.round(dist)}m`;

      if (dist > WORKSHOP.radius) {
        msg.textContent = `❌ You are ${Math.round(dist)}m away. Must be within ${WORKSHOP.radius}m to check in.`;
        return;
      }

      const records = getRecords(currentUser.id);
      let todayRec = records.find(r => r.date === today());

      if (!todayRec) {
        todayRec = { date: today(), checkIn: nowTime(), checkOut: null };
        records.push(todayRec);
        msg.textContent = `✅ Checked in at ${todayRec.checkIn}`;
      } else if (!todayRec.checkOut) {
        todayRec.checkOut = nowTime();
        msg.textContent = `✅ Checked out at ${todayRec.checkOut}`;
      }

      saveRecords(currentUser.id, records);
      renderWorker();
    },
    err => {
      const errors = { 1: "Location permission denied. Please allow location access.", 2: "Location unavailable.", 3: "Location request timed out." };
      msg.textContent = "❌ " + (errors[err.code] || "Location error.");
    },
    { enableHighAccuracy: true, timeout: 10000 }
  );
}

// ─── ADMIN PANEL ─────────────────────────────────────────────────────
function renderAdmin() {
  const filterDate = document.getElementById("filterDate").value;
  const workers = USERS.filter(u => !u.isAdmin);
  const todayStr = today();
  const thisMonth = new Date().toISOString().slice(0, 7);

  let presentToday = 0, totalToday = 0;
  const allRows = [];

  workers.forEach(w => {
    const records = getRecords(w.id);
    const todayRec = records.find(r => r.date === todayStr);
    if (todayRec?.checkIn) presentToday++;

    const filtered = filterDate ? records.filter(r => r.date === filterDate) : records;
    filtered.forEach(r => {
      allRows.push({ worker: w.name, role: w.role, ...r });
      totalToday++;
    });
  });

  // Stats
  document.getElementById("adminStats").innerHTML = `
    <div class="stat-card blue"><div class="num">${workers.length}</div><div class="lbl">Total Workers</div></div>
    <div class="stat-card green"><div class="num">${presentToday}</div><div class="lbl">Present Today</div></div>
    <div class="stat-card orange"><div class="num">${workers.length - presentToday}</div><div class="lbl">Absent Today</div></div>
    <div class="stat-card purple"><div class="num">${allRows.length}</div><div class="lbl">${filterDate ? "Records on Date" : "Total Records"}</div></div>
  `;

  // Attendance table
  const sorted = allRows.sort((a, b) => b.date.localeCompare(a.date));
  document.getElementById("adminTable").innerHTML = sorted.length ? sorted.map(r => `
    <tr>
      <td><strong>${r.worker}</strong></td>
      <td>${r.role}</td>
      <td>${fmtDate(r.date)}</td>
      <td>${r.checkIn || "—"}</td>
      <td>${r.checkOut || "—"}</td>
      <td><span class="badge ${r.checkOut ? 'present' : r.checkIn ? 'partial' : 'absent'}">${r.checkOut ? "Complete" : r.checkIn ? "Checked In" : "Absent"}</span></td>
    </tr>`).join("") : `<tr><td colspan="6" style="text-align:center;color:#aaa;padding:20px">No records found</td></tr>`;

  // Summary table
  document.getElementById("summaryTable").innerHTML = workers.map(w => {
    const records = getRecords(w.id);
    const lastRec = records.sort((a, b) => b.date.localeCompare(a.date))[0];
    return `
    <tr>
      <td><strong>${w.name}</strong></td>
      <td>${w.role}</td>
      <td>${records.filter(r => r.checkIn).length}</td>
      <td>${records.filter(r => r.date.startsWith(thisMonth) && r.checkIn).length}</td>
      <td>${lastRec ? fmtDate(lastRec.date) : "Never"}</td>
    </tr>`;
  }).join("");
}

// ─── INIT ─────────────────────────────────────────────────────────────
document.getElementById("loginPage").style.display = "flex";
document.getElementById("loginUser").addEventListener("keydown", e => e.key === "Enter" && login());
document.getElementById("loginPass").addEventListener("keydown", e => e.key === "Enter" && login());
