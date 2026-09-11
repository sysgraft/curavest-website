/**
 * Cloudflare Worker entry point.
 *
 * This project deploys as a Cloudflare Worker with static assets (`wrangler
 * deploy`) rather than a classic Cloudflare Pages project (`wrangler pages
 * deploy`) — see wrangler.toml's [assets] block. Every request lands here
 * first; anything other than the one API route below is handed straight to
 * the ASSETS binding, which serves the prebuilt `dist/` output (this is the
 * standard "Worker + static assets" routing pattern, not a fallback).
 *
 * POST /api/contact — handles submissions from the "Start a Conversation"
 * form. Kept isolated from the rest of the (fully static) site so it can be
 * wired up to a real email provider without touching the Astro build.
 *
 * REQUIRED CONFIGURATION (not present in this environment — see README.md):
 *   - RESEND_API_KEY     Worker environment variable / secret (Cloudflare
 *                         dashboard → Workers & Pages → curavest-website →
 *                         Settings → Variables and Secrets, "Runtime" —
 *                         not "Build"). Create a free account at
 *                         https://resend.com, verify the curavest.co.uk
 *                         sending domain, and generate an API key with
 *                         "Sending access".
 *   - CONTACT_TO_EMAIL   Optional. Destination inbox. Defaults to
 *                         euan.pallister@curavest.co.uk if not set.
 *   - CONTACT_FROM_EMAIL Optional. Verified "from" address on the Resend
 *                         domain, e.g. "Curavest Website <noreply@curavest.co.uk>".
 *                         Defaults to "Curavest Website <onboarding@resend.dev>"
 *                         which only works in Resend sandbox/testing mode.
 *
 * Until RESEND_API_KEY is configured, this responds with 503 and a clear,
 * honest message — the contact form's UI will never silently claim success
 * it can't back up. No credentials are hard-coded or invented here.
 */

export interface Env {
  ASSETS: Fetcher;
  RESEND_API_KEY?: string;
  CONTACT_TO_EMAIL?: string;
  CONTACT_FROM_EMAIL?: string;
}

interface ContactPayload {
  name?: string;
  business?: string;
  email?: string;
  phone?: string;
  message?: string;
  service?: string;
  contactPreference?: string;
  'company-website'?: string; // honeypot
}

const SERVICE_LABELS: Record<string, string> = {
  'fractional-cto': 'Fractional CTO Services',
  'ai-integration': 'AI Integration Services',
  'other-services': 'Other Curavest services',
  sysgraft: 'Sysgraft',
  'not-sure': 'Not sure yet',
};

const CONTACT_PREFERENCE_LABELS: Record<string, string> = {
  email: 'Email',
  phone: 'Phone',
  either: 'Either',
};

function jsonResponse(status: number, body: Record<string, unknown>) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json; charset=utf-8' },
  });
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

async function parseBody(request: Request): Promise<ContactPayload> {
  const contentType = request.headers.get('content-type') || '';
  if (contentType.includes('application/json')) {
    return (await request.json()) as ContactPayload;
  }
  const form = await request.formData();
  return Object.fromEntries(form.entries()) as ContactPayload;
}

async function handleContactPost(request: Request, env: Env): Promise<Response> {
  let payload: ContactPayload;
  try {
    payload = await parseBody(request);
  } catch {
    return jsonResponse(400, { ok: false, message: 'Could not read the submitted form data.' });
  }

  // Honeypot — silently accept without sending.
  if (payload['company-website']) {
    return jsonResponse(200, { ok: true });
  }

  const name = (payload.name || '').trim();
  const business = (payload.business || '').trim();
  const email = (payload.email || '').trim();
  const phone = (payload.phone || '').trim();
  const message = (payload.message || '').trim();
  const service = (payload.service || '').trim();
  const contactPreference = (payload.contactPreference || '').trim();

  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const errors: string[] = [];
  if (!name) errors.push('Name is required.');
  if (!business) errors.push('Business is required.');
  if (!email || !emailPattern.test(email)) errors.push('A valid email address is required.');
  if (!message) errors.push('A short description of what you would like to discuss is required.');

  if (errors.length > 0) {
    return jsonResponse(400, { ok: false, message: errors.join(' ') });
  }

  if (!env.RESEND_API_KEY) {
    // Isolated, honest failure — see file header. Do not fabricate success.
    return jsonResponse(503, {
      ok: false,
      message:
        "The contact form isn't fully configured yet. Please email us directly instead — your message will be read directly.",
    });
  }

  const toEmail = env.CONTACT_TO_EMAIL || 'euan.pallister@curavest.co.uk';
  const fromEmail = env.CONTACT_FROM_EMAIL || 'Curavest Website <onboarding@resend.dev>';

  const serviceLabel = SERVICE_LABELS[service] || 'Not specified';
  const preferenceLabel = CONTACT_PREFERENCE_LABELS[contactPreference] || 'Not specified';

  const html = `
    <h2>New conversation started via curavest.co.uk</h2>
    <p><strong>Name:</strong> ${escapeHtml(name)}</p>
    <p><strong>Business:</strong> ${escapeHtml(business)}</p>
    <p><strong>Email:</strong> ${escapeHtml(email)}</p>
    <p><strong>Phone:</strong> ${escapeHtml(phone || 'Not provided')}</p>
    <p><strong>Service of interest:</strong> ${escapeHtml(serviceLabel)}</p>
    <p><strong>Preferred contact method:</strong> ${escapeHtml(preferenceLabel)}</p>
    <p><strong>What they would like to discuss:</strong></p>
    <p>${escapeHtml(message).replace(/\n/g, '<br />')}</p>
  `;

  try {
    const resendResponse = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${env.RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: fromEmail,
        to: [toEmail],
        reply_to: email,
        subject: `New conversation: ${business} (${serviceLabel})`,
        html,
      }),
    });

    if (!resendResponse.ok) {
      const detail = await resendResponse.text();
      console.error('Resend API error', resendResponse.status, detail);
      return jsonResponse(502, {
        ok: false,
        message: 'The message could not be sent right now. Please try emailing us directly.',
      });
    }
  } catch (error) {
    console.error('Contact form send failure', error);
    return jsonResponse(502, {
      ok: false,
      message: 'The message could not be sent right now. Please try emailing us directly.',
    });
  }

  return jsonResponse(200, { ok: true });
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);

    if (url.pathname === '/api/contact') {
      if (request.method === 'POST') return handleContactPost(request, env);
      return jsonResponse(405, { ok: false, message: 'Method not allowed.' });
    }

    return env.ASSETS.fetch(request);
  },
};
