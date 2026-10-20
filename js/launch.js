function hostOf(url) {
  try {
    return new URL(url).host;
  } catch {
    return url;
  }
}

// Opens the site in a normal new tab. The address bar shows the real URL.
function openSite(site) {
  window.open(site.url, "_blank", "noopener");
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
  toastTimer = setTimeout(() => toast.classList.remove("show"), 3500);
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
