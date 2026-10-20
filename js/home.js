const grid = document.getElementById("grid");
const emptyMsg = document.getElementById("empty");
let sites = [];
let managing = false;

function openDetails(site) {
  location.href = `site.html?id=${encodeURIComponent(site.id)}`;
}

function renderCard(site) {
  const card = el("article", "card");

  const art = el("div", "card-art", site.icon);
  art.style.background = gradient(site);
  art.setAttribute("aria-hidden", "true");
  art.tabIndex = 0;
  art.setAttribute("role", "button");
  art.setAttribute("aria-label", `${site.name}: details`);
  art.addEventListener("click", () => openDetails(site));
  art.addEventListener("keydown", (e) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      openDetails(site);
    }
  });

  const body = el("div", "card-body");
  const title = el("div", "card-title");
  title.append(el("h3", null, site.name));

  if (managing) {
    const del = el("button", "del", "✕");
    del.type = "button";
    del.title = `Remove ${site.name}`;
    del.setAttribute("aria-label", del.title);
    del.addEventListener("click", async () => {
      del.disabled = true;
      try {
        sites = await removeSite(site.id);
        render();
        showToast(`Removed ${site.name}.`);
      } catch (err) {
        del.disabled = false;
        editFailed(err);
      }
    });
    title.append(del);
  } else {
    const open = el("button", "direct", "↗");
    open.type = "button";
    open.title = `Open ${hostOf(site.url)}`;
    open.setAttribute("aria-label", open.title);
    open.addEventListener("click", () => openSite(site));
    title.append(open);
  }

  body.append(title, el("p", "host", hostOf(site.url)));
  if (site.blurb) body.append(el("p", "blurb", site.blurb));

  const actions = el("div", "card-actions");
  const detailsBtn = el("button", "mini", "Details");
  detailsBtn.type = "button";
  detailsBtn.addEventListener("click", () => openDetails(site));
  const openBtn = el("button", "mini mini-open", "Open ↗");
  openBtn.type = "button";
  openBtn.addEventListener("click", () => openSite(site));
  actions.append(detailsBtn, openBtn);
  body.append(actions);

  card.append(art, body);
  return card;
}

function render() {
  grid.innerHTML = "";
  sites.forEach((s) => grid.append(renderCard(s)));
  emptyMsg.textContent = "No sites yet. Log in as admin and add one.";
  emptyMsg.hidden = sites.length > 0;
  document.body.classList.toggle("managing", managing);
}

async function refresh() {
  try {
    sites = await loadSites();
    render();
  } catch (err) {
    emptyMsg.textContent = `Couldn't load the list: ${err.message}`;
    emptyMsg.hidden = false;
  }
}

// --- Admin (server-checked login) -------------------------------------------

const editor = document.getElementById("editor");
const adminToggle = document.getElementById("admin-toggle");
const loginPanel = document.getElementById("login");
const loginForm = document.getElementById("login-form");
const form = document.getElementById("add-form");
const panel = document.getElementById("add-panel");
const addToggle = document.getElementById("add-toggle");
const manageToggle = document.getElementById("manage-toggle");
const resetBtn = document.getElementById("reset-btn");

let admin = false;

function editFailed(err) {
  showToast(err.message);
  if (err.status === 401) setAdmin(false);
}

function setManaging(on) {
  managing = on;
  manageToggle.textContent = on ? "Done" : "Manage";
  manageToggle.classList.toggle("active", on);
  render();
}

function setAdmin(on) {
  admin = on;
  editor.hidden = !on;
  loginPanel.hidden = true;
  adminToggle.textContent = on ? "🔓 Log out" : "🔒 Admin";
  adminToggle.setAttribute("aria-expanded", String(on));
  if (!on) {
    panel.hidden = true;
    if (managing) setManaging(false);
  }
}

adminToggle.addEventListener("click", async () => {
  if (admin) {
    try {
      await logOut();
    } catch {
      /* the cookie expires on its own anyway */
    }
    setAdmin(false);
    showToast("Logged out.");
    return;
  }
  const show = loginPanel.hidden;
  loginPanel.hidden = !show;
  adminToggle.setAttribute("aria-expanded", String(show));
  if (show) loginForm.elements.password.focus();
});

loginForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  const button = loginForm.querySelector("button");
  button.disabled = true;
  try {
    await logIn(loginForm.elements.password.value);
    loginForm.reset();
    setAdmin(true);
    showToast("Logged in. Changes you make show up for everyone.");
  } catch (err) {
    showToast(err.message);
    loginForm.elements.password.select();
  } finally {
    button.disabled = false;
  }
});

addToggle.addEventListener("click", () => {
  const show = panel.hidden;
  panel.hidden = !show;
  addToggle.setAttribute("aria-expanded", String(show));
  if (show) form.elements.name.focus();
});

manageToggle.addEventListener("click", () => setManaging(!managing));

resetBtn.addEventListener("click", async () => {
  if (!confirm("Reset the list back to the defaults? This removes everything added, for everyone.")) return;
  try {
    sites = await resetSites();
    setManaging(false);
    showToast("List reset to defaults.");
  } catch (err) {
    editFailed(err);
  }
});

form.addEventListener("submit", async (e) => {
  e.preventDefault();
  const button = form.querySelector('button[type="submit"]');
  const data = {
    name: form.elements.name.value,
    url: form.elements.url.value,
    description: form.elements.description.value,
    icon: form.elements.icon.value,
  };
  button.disabled = true;
  try {
    sites = await addSite(data);
    form.reset();
    panel.hidden = true;
    addToggle.setAttribute("aria-expanded", "false");
    render();
    showToast(`Added ${data.name.trim()}.`);
  } catch (err) {
    editFailed(err);
  } finally {
    button.disabled = false;
  }
});

refresh();
checkAdmin().then(setAdmin);
