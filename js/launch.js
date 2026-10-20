
function hostOf(url) {
  try {
    return new URL(url).host;
  } catch {
    return url;
  }
}

// Opens about:blank and embeds the selected website.
function openSite(site) {
  const win = window.open("about:blank", "_blank");

  if (!win) {
    showToast("Popup blocked. Allow popups and try again.");
    return;
  }

  const doc = win.document;
  doc.title = "Home";
  doc.documentElement.style.height = "100%";
  doc.body.style.cssText =
    "margin:0;height:100%;overflow:hidden;";

  const frame = doc.createElement("iframe");
  frame.src = site.url;
  frame.title = site.name || "Website";
  frame.style.cssText =
    "display:block;width:100%;height:100%;border:0;";
  frame.setAttribute("allowfullscreen", "");

  doc.body.appendChild(frame);
}

let toastTimer;

function showToast(message) {
  let toast = document.querySelector(".toast");

  if (!toast) {
    toast = document.createElement("div");
    toast.className = "toast";
    toast.setAttribute("role", "status");
    document.body.appendChild(toast);
  }

  toast.textContent = message;
  toast.classList.add("show");

  clearTimeout(toastTimer);
  toastTimer = setTimeout(
    () => toast.classList.remove("show"),
    3500
  );
}

function el(tag, className, text) {
  const node = document.createElement(tag);

  if (className) node.className = className;
  if (text != null) node.textContent = text;

  return node;
}

function gradient(site) {
  return `linear-gradient(135deg, ${site.colors[0]}, ${site.colors[1]})`;
}
