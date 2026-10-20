// Admin login. The password lives only in the ADMIN_PASSWORD env var on the
// server; the browser gets a signed, HttpOnly cookie that every edit request
// is checked against.
import crypto from "node:crypto";

const COOKIE = "room32_admin";
const SESSION_HOURS = 12;

// Session tokens are signed with a key derived from the password, so changing
// ADMIN_PASSWORD logs every open session out.
function signingKey() {
  const pw = process.env.ADMIN_PASSWORD;
  if (!pw) return null;
  return crypto
    .createHash("sha256")
    .update(`room32-session:${process.env.SESSION_SECRET || ""}:${pw}`)
    .digest();
}

function sign(payload, key) {
  return crypto.createHmac("sha256", key).update(payload).digest("base64url");
}

// Hash both sides first so the comparison takes the same time whatever the input length.
function safeEqual(a, b) {
  const ha = crypto.createHash("sha256").update(String(a)).digest();
  const hb = crypto.createHash("sha256").update(String(b)).digest();
  return crypto.timingSafeEqual(ha, hb);
}

function readCookie(req, name) {
  for (const part of (req.headers.cookie || "").split(";")) {
    const i = part.indexOf("=");
    if (i > -1 && part.slice(0, i).trim() === name) return decodeURIComponent(part.slice(i + 1).trim());
  }
  return null;
}

export function passwordIsSet() {
  return Boolean(process.env.ADMIN_PASSWORD);
}

export function passwordMatches(input) {
  return passwordIsSet() && typeof input === "string" && safeEqual(input, process.env.ADMIN_PASSWORD);
}

export function sessionCookie() {
  const exp = Date.now() + SESSION_HOURS * 3600 * 1000;
  const token = `${exp}.${sign(`admin.${exp}`, signingKey())}`;
  return `${COOKIE}=${token}; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=${SESSION_HOURS * 3600}`;
}

export function clearedCookie() {
  return `${COOKIE}=; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=0`;
}

export function isAdmin(req) {
  const key = signingKey();
  const token = readCookie(req, COOKIE);
  if (!key || !token) return false;
  const [exp, sig] = token.split(".");
  if (!sig || !(Number(exp) > Date.now())) return false;
  return safeEqual(sig, sign(`admin.${exp}`, key));
}

// Browsers send Origin on cross-site POST/DELETE; refuse anything that isn't
// from this site. (The SameSite=Strict cookie already covers most of this.)
export function sameOrigin(req) {
  const origin = req.headers.origin;
  if (!origin) return true;
  try {
    return new URL(origin).host === (req.headers["x-forwarded-host"] || req.headers.host);
  } catch {
    return false;
  }
}

export function requireAdmin(req, res) {
  if (!sameOrigin(req)) {
    res.status(403).json({ error: "Request blocked." });
    return false;
  }
  if (!isAdmin(req)) {
    res.status(401).json({ error: "Log in as admin first." });
    return false;
  }
  return true;
}

export function clientIp(req) {
  return String(req.headers["x-forwarded-for"] || "").split(",")[0].trim() || req.socket?.remoteAddress || "unknown";
}

export function readBody(req) {
  if (req.body && typeof req.body === "object") return req.body;
  try {
    return JSON.parse(req.body || "{}");
  } catch {
    return {};
  }
}
