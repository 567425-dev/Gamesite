// POST /api/reset → { sites }   admin: put the list back to the defaults
import { requireAdmin } from "./_lib/auth.js";
import { DEFAULT_SITES } from "./_lib/defaults.js";
import { hasStorage, resetSites } from "./_lib/store.js";

export default async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");
  try {
    if (req.method !== "POST") {
      res.setHeader("Allow", "POST");
      return res.status(405).json({ error: "Method not allowed." });
    }
    if (!requireAdmin(req, res)) return;
    if (!hasStorage()) {
      return res.status(503).json({ error: "Storage isn't connected yet, so the list can't be changed. See the README." });
    }
    await resetSites();
    return res.status(200).json({ sites: DEFAULT_SITES });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Something went wrong on the server." });
  }
}
