// script.js

// === GLOBALS ===
let currentUser = null; // Stores logged-in user info
let token = null;       // JWT or session token

// === PRESET ADMIN SESSION (for testing or dev) ===
const presetAdmin = {
  username: "admin",
  role: "admin",
  email: "mlkaggwa@mubs.ac.ug",
};
const presetToken = "4536"; // Should be a valid token for backend auth

// === LOGIN FORM SUBMIT HANDLER ===
document.getElementById("loginForm").addEventListener("submit", async (e) => {
  e.preventDefault();

  const username = document.getElementById("username").value.trim();
  const password = document.getElementById("password").value;

  // POST login request to backend
  const res = await fetch("/api/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, password }),
  });

  const data = await res.json();

  if (res.ok) {
    // Save user and token on success
    currentUser = data.user;
    token = data.token;
    localStorage.setItem("token", token);

    initDashboard();
    loadDocuments();
  } else {
    // Show login error
    const errorElem = document.getElementById("loginError");
    errorElem.style.display = "block";
    errorElem.innerText = data.message || "Login failed";
  }
});

// === INITIALIZE DASHBOARD UI ===
function initDashboard() {
  // Hide login section, show dashboard
  document.getElementById("loginSection").style.display = "none";
  document.getElementById("dashboard").style.display = "block";

  // Show logged-in user's role
  document.getElementById("userRoleDisplay").innerText = `Logged in as: ${currentUser.role}`;

  // Hide admin-only features for non-admin users
  if (currentUser.role !== "admin") {
    document.querySelectorAll(".admin-only").forEach(el => el.style.display = "none");
  }

  // Show default tab
  document.querySelectorAll(".tab-content").forEach(tc => (tc.style.display = "none"));
  const firstTab = document.querySelector(".tab");
  if (firstTab) firstTab.click();
}

// === TAB CLICK HANDLERS ===
document.querySelectorAll(".tab").forEach(btn => {
  btn.addEventListener("click", () => {
    document.querySelectorAll(".tab-content").forEach(tc => (tc.style.display = "none"));
    const tabId = btn.dataset.tab;
    const tabContent = document.getElementById(tabId);
    if (tabContent) tabContent.style.display = "block";
  });
});

// === LOGOUT BUTTON ===
document.getElementById("logoutBtn").addEventListener("click", () => {
  currentUser = null;
  token = null;
  localStorage.removeItem("token");

  document.getElementById("dashboard").style.display = "none";
  document.getElementById("loginSection").style.display = "flex";
});

// === UPLOAD DOCUMENT FORM ===
document.getElementById("uploadForm").addEventListener("submit", async (e) => {
  e.preventDefault();

  const title = document.getElementById("docTitle").value.trim();
  const fileInput = document.getElementById("docFile");

  if (!fileInput.files.length) {
    alert("Please select a file to upload.");
    return;
  }
  const file = fileInput.files[0];

  const formData = new FormData();
  formData.append("title", title);
  formData.append("file", file);

  // POST upload with authorization
  const res = await fetch("/api/documents/upload", {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
    body: formData,
  });

  if (res.ok) {
    loadDocuments();
    document.getElementById("uploadForm").reset();
  } else {
    alert("Upload failed");
  }
});

// === LOAD DOCUMENTS LIST ===
async function loadDocuments() {
  const res = await fetch("/api/documents", {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) {
    alert("Failed to load documents");
    return;
  }
  const docs = await res.json();

  const tbody = document.querySelector("#documentTable tbody");
  tbody.innerHTML = "";

  docs.forEach(doc => {
    const row = document.createElement("tr");
    row.innerHTML = `
      <td>${doc.title}</td>
      <td>${new Date(doc.created_at).toLocaleString()}</td>
      <td>
        <button class="view-btn" onclick="previewDocument('${doc.path}', '${doc.title}')">View</button>
        <button class="delete-btn" onclick="deleteDocument('${doc.id}')">Delete</button>
      </td>
    `;
    tbody.appendChild(row);
  });
}

// === PREVIEW DOCUMENT BASED ON EXTENSION ===
function previewDocument(path, title) {
  const ext = path.split('.').pop().toLowerCase();
  const viewer = document.getElementById("documentViewer");
  viewer.innerHTML = `<h3>${title}</h3>`;

  if (ext === "pdf") {
    showPDF(`/uploads/${path}`);
  } else {
    viewer.innerHTML += `<iframe src="/uploads/${path}" width="100%" height="500px" style="margin-block-start: 5px;"></iframe>`;
  }
}

// === PDF VIEWER FUNCTION USING pdfjs ===
function showPDF(url) {
  const viewer = document.getElementById("documentViewer");

  viewer.innerHTML += `
    <div id="pdfViewerContainer" style="position: relative;">
      <canvas id="pdfCanvas" style="border:1px solid #ccc;"></canvas>
      <div style="margin-block-start: 5px;">
        <button id="prevPage">Prev</button>
        <button id="nextPage">Next</button>
        <span id="pageInfo"></span>
      </div>
    </div>
  `;

  const canvas = document.getElementById("pdfCanvas");
  const ctx = canvas.getContext("2d");
  let pdfDoc = null;
  let pageNum = 1;

  pdfjsLib.getDocument(url).promise.then(function(pdf) {
    pdfDoc = pdf;
    renderPage(pageNum);
  });

  function renderPage(num) {
    pdfDoc.getPage(num).then(function(page) {
      const viewport = page.getViewport({ scale: 1.5 });
      canvas.height = viewport.height;
      canvas.width = viewport.width;

      const renderContext = {
        canvasContext: ctx,
        viewport: viewport,
      };
      page.render(renderContext);

      document.getElementById("pageInfo").textContent = `Page ${num} of ${pdfDoc.numPages}`;
    });
  }

  document.getElementById("prevPage").onclick = () => {
    if (pageNum <= 1) return;
    pageNum--;
    renderPage(pageNum);
  };

  document.getElementById("nextPage").onclick = () => {
    if (pageNum >= pdfDoc.numPages) return;
    pageNum++;
    renderPage(pageNum);
  };
}

// === DELETE DOCUMENT BY ID ===
async function deleteDocument(id) {
  if (!confirm("Delete this document?")) return;

  const res = await fetch(`/api/documents/${id}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${token}` },
  });

  if (res.ok) loadDocuments();
  else alert("Failed to delete document");
}

// === EXTRAS (RESULTS, TICKETS) ETC CAN BE ADDED SIMILARLY ===
// For example: fetch student results, complaints, tickets, etc.

// === PAGE LOAD SETUP ===
document.getElementById("dashboard").style.display = "none"; // hide dashboard initially

window.addEventListener("DOMContentLoaded", async () => {
  let savedToken = localStorage.getItem("token");
  if (savedToken) {
    try {
      const res = await fetch("/api/auth/session", {
        headers: { Authorization: `Bearer ${savedToken}` },
      });
      if (!res.ok) throw new Error("Invalid session");
      const data = await res.json();
      currentUser = data.user;
      token = savedToken;
      initDashboard();
      loadDocuments();
      return; // stop further execution if session is valid
    } catch {
      localStorage.removeItem("token");
      token = null;
    }
  }
  
  // No valid token found, fallback to preset admin (for dev/testing only)
  currentUser = presetAdmin;
  token = presetToken;
  localStorage.setItem("token", token);
  initDashboard();
  loadDocuments();
});
