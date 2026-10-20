const id = new URLSearchParams(location.search).get("id");
const root = document.getElementById("detail");

function renderNotFound(message) {
  document.title = "Not found · Room 32 Rebooted";
  root.append(el("h1", null, "Not found"), el("p", "muted", message));
}

function renderDetail(site) {
  document.title = `${site.name} · Room 32 Rebooted`;

  const head = el("div", "detail-head");
  const art = el("div", "detail-art", site.icon);
  art.style.background = gradient(site);
  art.setAttribute("aria-hidden", "true");
  const titles = el("div");
  titles.append(el("h1", null, site.name), el("p", "host", hostOf(site.url)));
  head.append(art, titles);
  root.append(head);

  if (site.blurb) {
    root.append(el("p", "desc", site.blurb));
  } else {
    root.append(el("p", "muted", "No description."));
  }

  const actions = el("div", "actions");
  const open = el("button", "btn btn-play", `Open ${site.name} ↗`);
  open.type = "button";
  open.addEventListener("click", () => openSite(site));
  actions.append(open);
  root.append(actions);
}

(async () => {
  try {
    const site = id && (await findSite(id));
    if (site) renderDetail(site);
    else renderNotFound("That one isn't in the list. Head back and pick another.");
  } catch (err) {
    renderNotFound(`Couldn't load the list: ${err.message}`);
  }
})();
