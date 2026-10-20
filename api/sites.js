// GET    /api/sites            → { sites }   public, everyone sees the same list
// POST   /api/sites  { site }  → { sites }   admin: add a site
// DELETE /api/sites?id=…       → { sites }   admin: remove a site
import crypto from "node:crypto";
import { readBody, requireAdmin } from "./_lib/auth.js";
import { getSites, hasStorage, saveSites } from "./_lib/store.js";

const MAX_SITES = 200;

function normalizeUrl(input) {
  const trimmed = String(input || "").trim();
  if (!trimmed || trimmed.length > 2048) return null;
  const withProto = /^[a-z][a-z0-9+.-]*:/i.test(trimmed) ? trimmed : `https://${trimmed}`;
  try {
    const url = new URL(withProto);
    return url.protocol === "https:" || url.protocol === "http:" ? url.href : null;
  } catch {
    return null;
  }
}

function makeId(name) {
  const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "").slice(0, 40);
  return `${slug || "site"}-${crypto.randomBytes(3).toString("hex")}`;
}

function cleanSite(input) {
  const name = String(input.name || "").trim();
  const icon = String(input.icon || "").trim() || "🔗";
  const blurb = String(input.description || "").trim();
  const url = normalizeUrl(input.url);
  if (!name) return { error: "Give it a name." };
  if (name.length > 60) return { error: "Keep the name under 60 characters." };
  if (!url) return { error: "That doesn't look like a web address." };
  if (icon.length > 16) return { error: "The emoji field takes one emoji." };
  if (blurb.length > 300) return { error: "Keep the description under 300 characters." };
  return { site: { id: makeId(name), name, icon, url, blurb } };
}

export default async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");
  try {
    if (req.method === "GET") {
      return res.status(200).json({ sites: await getSites() });
    }
    if (req.method !== "POST" && req.method !== "DELETE") {
      res.setHeader("Allow", "GET, POST, DELETE");
      return res.status(405).json({ error: "Method not allowed." });
    }
    if (!requireAdmin(req, res)) return;
    if (!hasStorage()) {
      return res.status(503).json({ error: "Storage isn't connected yet, so the list can't be changed. See the README." });
    }

    const list = await getSites();

    if (req.method === "POST") {
      const { site, error } = cleanSite(readBody(req));
      if (error) return res.status(400).json({ error });
      if (list.length >= MAX_SITES) return res.status(400).json({ error: `The list is full (${MAX_SITES} sites).` });
      const next = [...list, site];
      await saveSites(next);
      return res.status(200).json({ sites: next });
    }

    const id = String(req.query?.id || "");
    const next = list.filter((s) => s.id !== id);
    if (next.length === list.length) return res.status(404).json({ error: "That site isn't in the list." });
    await saveSites(next);
    return res.status(200).json({ sites: next });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Something went wrong on the server." });
  }
}
