// GET    /api/session  → { admin }        is this browser logged in?
// POST   /api/session  { password }       log in
// DELETE /api/session                     log out
import { clearedCookie, clientIp, isAdmin, passwordIsSet, passwordMatches, readBody, sameOrigin, sessionCookie } from "./_lib/auth.js";
import { hasStorage, redis } from "./_lib/store.js";

// Lock an address out for 15 minutes after 10 wrong passwords.
const MAX_FAILURES = 10;
const LOCKOUT_SECONDS = 15 * 60;

async function failures(ip) {
  if (!hasStorage()) return 0;
  return Number(await redis("GET", `room32:login-fail:${ip}`)) || 0;
}

async function recordFailure(ip) {
  if (!hasStorage()) return;
  const key = `room32:login-fail:${ip}`;
  await redis("INCR", key);
  await redis("EXPIRE", key, LOCKOUT_SECONDS);
}

async function clearFailures(ip) {
  if (hasStorage()) await redis("DEL", `room32:login-fail:${ip}`);
}

export default async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");
  try {
    if (req.method === "GET") {
      return res.status(200).json({ admin: isAdmin(req) });
    }
    if (req.method !== "POST" && req.method !== "DELETE") {
      res.setHeader("Allow", "GET, POST, DELETE");
      return res.status(405).json({ error: "Method not allowed." });
    }
    if (!sameOrigin(req)) return res.status(403).json({ error: "Request blocked." });

    if (req.method === "DELETE") {
      res.setHeader("Set-Cookie", clearedCookie());
      return res.status(200).json({ admin: false });
    }

    if (!passwordIsSet()) {
      return res.status(503).json({ error: "No admin password is set on the server yet (ADMIN_PASSWORD)." });
    }
    const ip = clientIp(req);
    if ((await failures(ip)) >= MAX_FAILURES) {
      return res.status(429).json({ error: "Too many wrong passwords. Try again in 15 minutes." });
    }
    if (!passwordMatches(readBody(req).password)) {
      await recordFailure(ip);
      return res.status(401).json({ error: "Wrong password." });
    }
    await clearFailures(ip);
    res.setHeader("Set-Cookie", sessionCookie());
    return res.status(200).json({ admin: true });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Something went wrong on the server." });
  }
}
