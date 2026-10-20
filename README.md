# Room 32 Rebooted

A small launcher page. Sites open in a normal new tab. There's one shared list:
when the admin adds or removes a site, everyone who opens the page sees the change.

## How it fits together

- `index.html`, `site.html`, `js/`, `css/`: the static page.
- `api/sites.js`: `GET` returns the list to anyone. `POST` (add) and `DELETE` (remove)
  are admin-only.
- `api/reset.js`: admin-only, puts the list back to the defaults.
- `api/session.js`: log in and log out.
- `api/_lib/defaults.js`: the starting list.

The list is stored in Upstash Redis. The admin password is kept only on the server.
It never appears in the page source.

## Deploy to Vercel

1. Push this folder to a GitHub repo. On vercel.com, choose **Add New → Project** and
   import it. Set Framework Preset to **Other** and deploy.
2. **Add storage.** In the project, open **Storage → Create Database → Upstash for
   Redis** (the free plan is enough) and connect it to the project. This adds the
   `KV_REST_API_URL` and `KV_REST_API_TOKEN` environment variables. If you set up
   Upstash yourself, `UPSTASH_REDIS_REST_URL` / `UPSTASH_REDIS_REST_TOKEN` work too.
3. **Set the password.** Under **Settings → Environment Variables**, add
   `ADMIN_PASSWORD` with a long password of your choice.
4. Redeploy so the new variables take effect.

Before storage is connected, the page shows the default list and the editor refuses
changes with a message saying why.

## The editor

- Click **🔒 Admin**, enter the password, and press **Log in**. The login lasts 12 hours,
  or until you click **🔓 Log out**.
- **＋ Add site**: name, address, optional emoji, optional description.
- **Manage**: shows a ✕ on each card so you can remove it.
- **Reset to defaults**: restores the starting list for everyone.

### How the login is protected

- The password is checked on the server and compared in constant time.
- A successful login sets a signed, `HttpOnly`, `SameSite=Strict` cookie. Every change
  to the list is checked against that cookie on the server.
- After 10 wrong passwords, that IP address is locked out for 15 minutes.
- Changing `ADMIN_PASSWORD` (and redeploying) logs out every existing session.
  Optionally set `SESSION_SECRET` to any long random string for an extra signing key.

## Changing the starting list

Edit `DEFAULT_SITES` in `api/_lib/defaults.js`. The defaults appear until the admin
first changes the list, and again after **Reset to defaults**.

## Run locally

The API needs Vercel's dev server. A plain static server won't run it.

```bash
npm i -g vercel
vercel link          # once, to connect this folder to your Vercel project
vercel env pull      # copies ADMIN_PASSWORD and the Redis vars into .env.local
vercel dev           # http://localhost:3000
```
