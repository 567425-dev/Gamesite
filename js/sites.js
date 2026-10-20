// --- Shared list ------------------------------------------------------------
// The list lives on the server (api/sites.js), so everyone who opens the site
// sees the same one. Only a logged-in admin can change it. The starting list is
// DEFAULT_SITES in api/_lib/defaults.js.

// Gradient pairs handed out to entries so each card gets its own colour.
const PALETTE = [
  ["#ff7a18", "#af002d"],
  ["#22d3ee", "#3b5bfd"],
  ["#a855f7", "#ec4899"],
  ["#34d399", "#059669"],
  ["#f59e0b", "#db2777"],
  ["#60a5fa", "#7c3aed"],
];

function pickColors(i) {
  return PALETTE[i % PALETTE.length];
}

function withColors(list) {
  return list.map((s, i) => ({ ...s, colors: s.colors || pickColors(i) }));
}

// Calls one of the /api endpoints. Throws with the server's message on failure.
async function api(path, { method = "GET", body } = {}) {
  let res;
  try {
    res = await fetch(path, {
      method,
      credentials: "same-origin",
      headers: body ? { "Content-Type": "application/json" } : undefined,
      body: body ? JSON.stringify(body) : undefined,
    });
  } catch {
    throw new Error("Couldn't reach the server.");
  }
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const err = new Error(data.error || `The server said no (${res.status}).`);
    err.status = res.status;
    throw err;
  }
  return data;
}

// Each of these resolves to the full, updated list.

async function loadSites() {
  return withColors((await api("/api/sites")).sites);
}

async function addSite({ name, url, description, icon }) {
  return withColors((await api("/api/sites", { method: "POST", body: { name, url, description, icon } })).sites);
}

async function removeSite(id) {
  return withColors((await api(`/api/sites?id=${encodeURIComponent(id)}`, { method: "DELETE" })).sites);
}

async function resetSites() {
  return withColors((await api("/api/reset", { method: "POST" })).sites);
}

async function findSite(id) {
  return (await loadSites()).find((s) => s.id === id);
}

// --- Admin session ----------------------------------------------------------

async function checkAdmin() {
  try {
    return (await api("/api/session")).admin;
  } catch {
    return false;
  }
}

async function logIn(password) {
  await api("/api/session", { method: "POST", body: { password } });
}

async function logOut() {
  await api("/api/session", { method: "DELETE" });
}
