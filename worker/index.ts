/**
 * Cloudflare Worker entry point.
 *
 * This project deploys as a Cloudflare Worker with static assets (`wrangler
 * deploy`) rather than a classic Cloudflare Pages project (`wrangler pages
 * deploy`) — see wrangler.toml's [assets] block. Every request lands here
 * first and is handed straight to the ASSETS binding, which serves the
 * prebuilt `dist/` output (the standard "Worker + static assets" routing
 * pattern) and — via [assets] not_found_handling = "404-page" — the built,
 * styled dist/404.html for any unmatched path.
 *
 * The site has no other backend routes. The "Start a Conversation" contact
 * form posts directly from the browser to a Supabase Edge Function
 * (supabase/functions/curavest-contact-form/) rather than to this Worker —
 * see src/components/ContactForm.astro and README.md "Contact form setup".
 * An earlier version of this file handled POST /api/contact itself; that
 * logic has moved to Supabase so the Worker can stay a pure static-asset
 * server.
 */

export interface Env {
  ASSETS: Fetcher;
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    return env.ASSETS.fetch(request);
  },
};
