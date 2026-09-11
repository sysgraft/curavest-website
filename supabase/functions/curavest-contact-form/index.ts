// Supabase Edge Function: curavest-contact-form
//
// Handles submissions from the "Start a Conversation" form on
// https://curavest.co.uk (src/components/ContactForm.astro). Called
// directly from the browser — the site is fully static, so this function
// (not the Cloudflare Worker) is the site's entire contact-form backend.
//
// On every valid, non-honeypot submission this:
//   1. Writes the enquiry to public.curavest_contact_submissions (service
//      role — RLS on that table has no policies, so no anon/authenticated
//      client can read or write it directly; only this function can).
//   2. Emails a full notification to Curavest (Resend), so the enquiry is
//      read directly by a person, as the site's copy promises.
//   3. Emails a short confirmation back to the visitor.
//
// REQUIRED CONFIGURATION (set as Edge Function secrets — Supabase dashboard
// → Project Settings → Edge Functions → curavest-contact-form → Secrets, or
// `supabase secrets set` — NOT available to set via this project's tooling,
// so this is the one manual step left to make sending live):
//   RESEND_API_KEY      Required to actually send mail. Create a free
//                        account at https://resend.com, verify the
//                        curavest.co.uk sending domain, and generate an API
//                        key with "Sending access". Until this is set, the
//                        function still records every submission in the
//                        database, but honestly reports 503 to the visitor
//                        instead of claiming an email was sent — see
//                        README.md "Contact form setup".
//   CONTACT_TO_EMAIL     Optional. Destination inbox for the notification.
//                        Defaults to euan.pallister@curavest.co.uk.
//   CONTACT_FROM_EMAIL   Optional. Verified "from" address on the Resend
//                        domain, e.g. "Curavest <noreply@curavest.co.uk>".
//                        Defaults to a Resend sandbox address that only
//                        works for test sends, not real delivery.
//
// SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are provided automatically to
// every Edge Function by the Supabase runtime — nothing to configure there.
//
// No credentials are hard-coded or invented in this file.

import { createClient } from 'jsr:@supabase/supabase-js@2';

const SITE_URL = 'https://curavest.co.uk';
const SITE_NAME = 'Curavest';
const LOGO_URL = `${SITE_URL}/brand/email/curavest-logo.png`;
const DEFAULT_TO_EMAIL = 'euan.pallister@curavest.co.uk';
const DEFAULT_FROM_EMAIL = 'Curavest Website <onboarding@resend.dev>';

// Curavest brand tokens (src/styles/tokens.css) — kept in sync by hand,
// since email HTML can't read the site's CSS custom properties.
const COLOR = {
  ink: '#2c2c2c',
  ink2: '#4a4a4a',
  ink3: '#5c5c5c',
  paper: '#ffffff',
  paperRaised: '#f8f9fa',
  line: '#e3e3e3',
  lineStrong: '#cacaca',
  petrol: '#0056b3',
  petrolStrong: '#00408a',
} as const;

const FONT_STACK =
  "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif";

// ---------------------------------------------------------------------------
// CORS
// ---------------------------------------------------------------------------

const ALLOWED_ORIGIN_PATTERNS: RegExp[] = [
  /^https:\/\/(www\.)?curavest\.co\.uk$/,
  /^https:\/\/[a-z0-9-]+\.curavest-website(-[a-z0-9]+)?\.workers\.dev$/,
  /^http:\/\/localhost(:\d+)?$/,
];

function isAllowedOrigin(origin: string | null): boolean {
  if (!origin) return false;
  return ALLOWED_ORIGIN_PATTERNS.some((pattern) => pattern.test(origin));
}

function corsHeaders(origin: string | null): HeadersInit {
  const headers: Record<string, string> = {
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'authorization, apikey, content-type',
    'Access-Control-Max-Age': '86400',
    Vary: 'Origin',
  };
  if (isAllowedOrigin(origin)) {
    headers['Access-Control-Allow-Origin'] = origin as string;
  }
  return headers;
}

function jsonResponse(status: number, body: Record<string, unknown>, origin: string | null) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      ...corsHeaders(origin),
    },
  });
}

// ---------------------------------------------------------------------------
// Payload
// ---------------------------------------------------------------------------

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

function escapeHtml(value: string) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function contactMethodPhrase(preferenceLabel: string): string {
  switch (preferenceLabel) {
    case 'Email':
      return 'by email';
    case 'Phone':
      return 'by phone';
    case 'Either':
      return 'by phone or email, whichever suits you';
    default:
      return 'by email or phone';
  }
}

// ---------------------------------------------------------------------------
// Email templates
// ---------------------------------------------------------------------------
// Table-based, inline-styled, no external CSS — built to survive Outlook,
// Gmail and Apple Mail's varying levels of support. Sharp (0px) corners
// throughout, per the brand guidelines' "industrial" button/card treatment.

function renderShell(options: {
  preheader: string;
  eyebrow: string;
  title: string;
  bodyHtml: string;
}): string {
  const { preheader, eyebrow, title, bodyHtml } = options;
  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <meta name="color-scheme" content="light" />
    <meta name="supported-color-schemes" content="light" />
    <title>${escapeHtml(title)}</title>
    <style>
      @media screen and (max-width: 620px) {
        .cv-wrap { width: 100% !important; }
        .cv-px { padding-left: 24px !important; padding-right: 24px !important; }
        .cv-title { font-size: 22px !important; }
      }
    </style>
  </head>
  <body style="margin:0; padding:0; background:${COLOR.paperRaised}; -webkit-text-size-adjust:100%; text-size-adjust:100%;">
    <div style="display:none; max-height:0; overflow:hidden; opacity:0; mso-hide:all;">
      ${escapeHtml(preheader)}
    </div>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:${COLOR.paperRaised};">
      <tr>
        <td align="center" style="padding: 32px 16px;">
          <table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0" class="cv-wrap" style="width:600px; max-width:600px; background:${COLOR.paper};">
            <!-- Header -->
            <tr>
              <td class="cv-px" style="padding: 32px 40px 24px 40px; border-bottom: 1px solid ${COLOR.line};">
                <img src="${LOGO_URL}" width="160" height="52" alt="${SITE_NAME}" style="display:block; border:0; outline:none; width:160px; height:auto;" />
              </td>
            </tr>
            <!-- Eyebrow + Title -->
            <tr>
              <td class="cv-px" style="padding: 40px 40px 0 40px;">
                <p style="margin:0 0 12px 0; font-family:${FONT_STACK}; font-size:12px; line-height:1; font-weight:700; letter-spacing:0.5px; text-transform:uppercase; color:${COLOR.petrol};">
                  ${escapeHtml(eyebrow)}
                </p>
                <h1 class="cv-title" style="margin:0 0 28px 0; font-family:${FONT_STACK}; font-size:26px; line-height:1.2; font-weight:700; letter-spacing:-0.02em; color:${COLOR.ink};">
                  ${escapeHtml(title)}
                </h1>
              </td>
            </tr>
            <!-- Body -->
            <tr>
              <td class="cv-px" style="padding: 0 40px 40px 40px; font-family:${FONT_STACK}; font-size:15px; line-height:1.6; color:${COLOR.ink2};">
                ${bodyHtml}
              </td>
            </tr>
            <!-- Footer -->
            <tr>
              <td class="cv-px" style="padding: 24px 40px 32px 40px; border-top: 1px solid ${COLOR.line};">
                <p style="margin:0 0 4px 0; font-family:${FONT_STACK}; font-size:13px; line-height:1.6; color:${COLOR.ink3};">
                  Curavest Ltd &middot; Fractional CTO and AI Integration services for UK operational businesses
                </p>
                <p style="margin:0; font-family:${FONT_STACK}; font-size:13px; line-height:1.6;">
                  <a href="${SITE_URL}" style="color:${COLOR.ink3}; text-decoration:underline;">curavest.co.uk</a>
                </p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;
}

function detailRow(label: string, value: string): string {
  return `
    <tr>
      <td style="padding: 10px 0; border-bottom: 1px solid ${COLOR.line}; font-family:${FONT_STACK}; font-size:13px; font-weight:600; letter-spacing:0.5px; text-transform:uppercase; color:${COLOR.ink3}; width:140px; vertical-align:top;">
        ${escapeHtml(label)}
      </td>
      <td style="padding: 10px 0; border-bottom: 1px solid ${COLOR.line}; font-family:${FONT_STACK}; font-size:15px; color:${COLOR.ink}; vertical-align:top;">
        ${value}
      </td>
    </tr>`;
}

function ctaButton(label: string, href: string): string {
  return `
    <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin-top: 8px;">
      <tr>
        <td style="background:${COLOR.petrol}; border:1px solid ${COLOR.petrol};">
          <a href="${href}" style="display:inline-block; padding: 13px 28px; font-family:${FONT_STACK}; font-size:14px; font-weight:600; letter-spacing:0.5px; color:${COLOR.paper}; text-decoration:none;">
            ${escapeHtml(label)}
          </a>
        </td>
      </tr>
    </table>`;
}

function renderNotificationEmail(fields: {
  name: string;
  business: string;
  email: string;
  phone: string;
  message: string;
  serviceLabel: string;
  preferenceLabel: string;
  submittedAt: string;
}): { subject: string; html: string } {
  const { name, business, email, phone, message, serviceLabel, preferenceLabel, submittedAt } = fields;

  const bodyHtml = `
    <p style="margin:0 0 24px 0;">A new enquiry was submitted via the "Start a Conversation" form on curavest.co.uk.</p>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom: 24px;">
      ${detailRow('Name', escapeHtml(name))}
      ${detailRow('Business', escapeHtml(business))}
      ${detailRow('Email', `<a href="mailto:${escapeHtml(email)}" style="color:${COLOR.petrol}; text-decoration:underline;">${escapeHtml(email)}</a>`)}
      ${detailRow('Phone', phone ? escapeHtml(phone) : 'Not provided')}
      ${detailRow('Service of interest', escapeHtml(serviceLabel))}
      ${detailRow('Preferred contact', escapeHtml(preferenceLabel))}
      ${detailRow('Submitted', escapeHtml(submittedAt))}
    </table>
    <p style="margin:0 0 8px 0; font-family:${FONT_STACK}; font-size:13px; font-weight:600; letter-spacing:0.5px; text-transform:uppercase; color:${COLOR.ink3};">
      What they'd like to discuss
    </p>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:${COLOR.paperRaised}; border-left: 3px solid ${COLOR.petrol}; margin-bottom: 28px;">
      <tr>
        <td style="padding: 18px 20px; font-family:${FONT_STACK}; font-size:15px; line-height:1.6; color:${COLOR.ink};">
          ${escapeHtml(message).replace(/\n/g, '<br />')}
        </td>
      </tr>
    </table>
    ${ctaButton(`Reply to ${name.split(' ')[0]}`, `mailto:${email}?subject=${encodeURIComponent(`Re: Your enquiry to Curavest`)}`)}
  `;

  return {
    subject: `New conversation: ${business} (${serviceLabel})`,
    html: renderShell({
      preheader: `${name} from ${business} started a conversation — ${serviceLabel}.`,
      eyebrow: 'New enquiry',
      title: `${business} would like to talk`,
      bodyHtml,
    }),
  };
}

function renderConfirmationEmail(fields: {
  name: string;
  business: string;
  message: string;
  serviceLabel: string;
  preferenceLabel: string;
}): { subject: string; html: string } {
  const { name, message, serviceLabel, preferenceLabel } = fields;
  const firstName = name.trim().split(/\s+/)[0] || name;

  const bodyHtml = `
    <p style="margin:0 0 20px 0;">Hi ${escapeHtml(firstName)},</p>
    <p style="margin:0 0 20px 0;">
      Thanks for getting in touch with Curavest about <strong>${escapeHtml(serviceLabel)}</strong>.
      Your message will be read directly — there is no obligation to proceed, and no automated
      queue in between.
    </p>
    <p style="margin:0 0 28px 0;">
      We'll follow up ${escapeHtml(contactMethodPhrase(preferenceLabel))}, using the details you provided.
    </p>
    <p style="margin:0 0 8px 0; font-family:${FONT_STACK}; font-size:13px; font-weight:600; letter-spacing:0.5px; text-transform:uppercase; color:${COLOR.ink3};">
      What you sent us
    </p>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:${COLOR.paperRaised}; border-left: 3px solid ${COLOR.petrol}; margin-bottom: 28px;">
      <tr>
        <td style="padding: 18px 20px; font-family:${FONT_STACK}; font-size:15px; line-height:1.6; color:${COLOR.ink};">
          ${escapeHtml(message).replace(/\n/g, '<br />')}
        </td>
      </tr>
    </table>
    <p style="margin:0 0 4px 0;">
      Prefer to reach us directly in the meantime? Email
      <a href="mailto:${DEFAULT_TO_EMAIL}" style="color:${COLOR.petrol}; text-decoration:underline;">${DEFAULT_TO_EMAIL}</a>
      or call <a href="tel:+441183913212" style="color:${COLOR.petrol}; text-decoration:underline;">+44 (0)118 391 3212</a>.
    </p>
  `;

  return {
    subject: `We've received your message — Curavest`,
    html: renderShell({
      preheader: `Thanks for reaching out to Curavest — we'll be in touch shortly.`,
      eyebrow: 'Thanks for reaching out',
      title: `We've received your message`,
      bodyHtml,
    }),
  };
}

// ---------------------------------------------------------------------------
// Resend
// ---------------------------------------------------------------------------

async function sendEmail(env: {
  apiKey: string;
  from: string;
  to: string;
  replyTo: string;
  subject: string;
  html: string;
}): Promise<{ ok: true } | { ok: false; detail: string }> {
  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${env.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: env.from,
        to: [env.to],
        reply_to: env.replyTo,
        subject: env.subject,
        html: env.html,
      }),
    });

    if (!response.ok) {
      const detail = await response.text();
      return { ok: false, detail: `Resend ${response.status}: ${detail}` };
    }
    return { ok: true };
  } catch (error) {
    return { ok: false, detail: error instanceof Error ? error.message : String(error) };
  }
}

// ---------------------------------------------------------------------------
// Handler
// ---------------------------------------------------------------------------

Deno.serve(async (req: Request) => {
  const origin = req.headers.get('Origin');

  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders(origin) });
  }

  if (req.method !== 'POST') {
    return jsonResponse(405, { ok: false, message: 'Method not allowed.' }, origin);
  }

  let payload: ContactPayload;
  try {
    payload = await req.json();
  } catch {
    return jsonResponse(400, { ok: false, message: 'Could not read the submitted form data.' }, origin);
  }

  // Honeypot — silently accept without recording or emailing.
  if (payload['company-website']) {
    return jsonResponse(200, { ok: true }, origin);
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
    return jsonResponse(400, { ok: false, message: errors.join(' ') }, origin);
  }

  const serviceLabel = SERVICE_LABELS[service] || 'Not specified';
  const preferenceLabel = CONTACT_PREFERENCE_LABELS[contactPreference] || 'Not specified';

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
  );

  const { data: inserted, error: insertError } = await supabase
    .from('curavest_contact_submissions')
    .insert({
      name,
      business,
      email,
      phone: phone || null,
      message,
      service: service || null,
      contact_preference: contactPreference || null,
    })
    .select('id')
    .single();

  if (insertError) {
    console.error('curavest-contact-form: failed to record submission', insertError);
    return jsonResponse(502, {
      ok: false,
      message: 'The message could not be sent right now. Please try emailing us directly.',
    }, origin);
  }

  const resendApiKey = Deno.env.get('RESEND_API_KEY');
  if (!resendApiKey) {
    // Isolated, honest failure — see file header. The submission is safely
    // recorded above; only the email send is unavailable.
    return jsonResponse(503, {
      ok: false,
      message:
        "The contact form isn't fully configured yet. Please email us directly instead — your message will be read directly.",
    }, origin);
  }

  const toEmail = Deno.env.get('CONTACT_TO_EMAIL') || DEFAULT_TO_EMAIL;
  const fromEmail = Deno.env.get('CONTACT_FROM_EMAIL') || DEFAULT_FROM_EMAIL;

  const notification = renderNotificationEmail({
    name,
    business,
    email,
    phone,
    message,
    serviceLabel,
    preferenceLabel,
    submittedAt: new Date().toLocaleString('en-GB', { timeZone: 'Europe/London', dateStyle: 'medium', timeStyle: 'short' }),
  });

  const notificationResult = await sendEmail({
    apiKey: resendApiKey,
    from: fromEmail,
    to: toEmail,
    replyTo: email,
    subject: notification.subject,
    html: notification.html,
  });

  if (!notificationResult.ok) {
    console.error('curavest-contact-form: notification send failed', notificationResult.detail);
    await supabase
      .from('curavest_contact_submissions')
      .update({ notification_sent: false, notification_error: notificationResult.detail.slice(0, 500) })
      .eq('id', inserted.id);

    return jsonResponse(502, {
      ok: false,
      message: 'The message could not be sent right now. Please try emailing us directly.',
    }, origin);
  }

  await supabase
    .from('curavest_contact_submissions')
    .update({ notification_sent: true })
    .eq('id', inserted.id);

  // Visitor confirmation — best-effort. Its failure shouldn't turn a
  // successful enquiry (Curavest has it, and will reply) into an error for
  // the visitor.
  try {
    const confirmation = renderConfirmationEmail({ name, business, message, serviceLabel, preferenceLabel });
    const confirmationResult = await sendEmail({
      apiKey: resendApiKey,
      from: fromEmail,
      to: email,
      replyTo: toEmail,
      subject: confirmation.subject,
      html: confirmation.html,
    });
    if (!confirmationResult.ok) {
      console.error('curavest-contact-form: confirmation send failed', confirmationResult.detail);
    }
  } catch (error) {
    console.error('curavest-contact-form: confirmation send threw', error);
  }

  return jsonResponse(200, { ok: true }, origin);
});
