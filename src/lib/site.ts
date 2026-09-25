// Central site data: URLs, navigation structure, and organisation details
// used across layouts, components and structured data.

export const SITE = {
  name: 'Curavest',
  legalName: 'Curavest Ltd',
  // The www host is the site's main address. The curavest.co.uk DNS zone is
  // held at GoDaddy by the domain's owner, and the bare domain is a GoDaddy
  // forward that sends only the homepage to www (every deeper path on the
  // bare domain returns a blank page). www is the host that actually serves
  // every page, so canonicals, the sitemap and structured data all use it.
  url: 'https://www.curavest.co.uk',
  tagline: 'Fractional CTO and related services for UK operational businesses',
  description:
    'Curavest offers several complementary services for UK operational businesses. Explore our fractional CTO service and related offerings to improve processes, output and technology decisions.',
  email: 'euan.pallister@curavest.co.uk',
  phoneLandline: '+441183913212',
  phoneLandlineDisplay: '+44 (0)118 391 3212',
  phoneMobile: '+447484094848',
  phoneMobileDisplay: '+44 (0)7484 094848',
  consultant: 'Euan Pallister',
  locale: 'en_GB',
  sysgraftUrl: 'https://sysgraft.com',
  // Statutory company details (Companies House, checked 25 Sep 2026). UK
  // limited companies must show these on their website; they're also the
  // clearest signal separating Curavest Ltd from the unrelated US firm
  // Curavest Partners in search and AI answers.
  companyNumber: '15433116',
  registeredIn: 'England and Wales',
  registeredOffice: {
    street: '334 Reading Road',
    locality: 'Winnersh',
    town: 'Wokingham',
    postcode: 'RG41 5EJ',
    country: 'GB',
  },
  registeredOfficeDisplay: '334 Reading Road, Winnersh, Wokingham, RG41 5EJ',
  foundingDate: '2024-01-22',
  companiesHouseUrl: 'https://find-and-update.company-information.service.gov.uk/company/15433116',
  // Profiles confirmed as Curavest's / Euan's own (25 Sep 2026).
  linkedinCompanyUrl: 'https://www.linkedin.com/company/curavest-ltd/',
  consultantLinkedinUrl: 'https://www.linkedin.com/in/euan-pallister/',
} as const;

// Contact form backend — a Supabase Edge Function (supabase/functions/
// curavest-contact-form/), called directly from the browser since this site
// is fully static. See that function's file header and README.md "Contact
// form setup" for what still needs configuring before it can send mail.
//
// SUPABASE_ANON_KEY is the project's public "anon" key — safe to ship in
// client-side code by design (this is what every browser-based Supabase
// app does; it is not the secret service-role key, which stays inside the
// Edge Function itself). It authenticates the request as coming from a
// Supabase client, not an individual visitor; the function does its own
// field validation and honeypot check regardless.
export const CONTACT_FORM = {
  supabaseUrl: 'https://aoadptvrfuietytyfccp.supabase.co',
  functionUrl: 'https://aoadptvrfuietytyfccp.supabase.co/functions/v1/curavest-contact-form',
  anonKey:
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFvYWRwdHZyZnVpZXR5dHlmY2NwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODA1NTI3MzUsImV4cCI6MjA5NjEyODczNX0.OoZEukewzkazw9KQrOR9sUTD8TrS90VgCCwlVOscxNw',
} as const;

export type NavChild = {
  label: string;
  href: string;
  description?: string;
};

export type NavItem = {
  label: string;
  href: string;
  children?: NavChild[];
};

export const NAV: NavItem[] = [
  { label: 'Home', href: '/' },
  {
    label: 'Services',
    href: '/services/',
    children: [
      {
        label: 'Fractional CTO Services',
        href: '/services/fractional-cto/',
        description: 'Part-time, embedded technology and process leadership.',
      },
      {
        label: 'How It Works',
        href: '/services/fractional-cto/how-it-works/',
        description: 'Diagnose, engineer, prove — our three-stage method.',
      },
      {
        label: 'Who We Work With',
        href: '/services/fractional-cto/who-we-work-with/',
        description: 'The businesses and sectors we are the right fit for.',
      },
      {
        label: 'AI Integration Services',
        href: '/services/ai-integration/',
        description: 'Understand, create and implement — AI applied where it earns its place.',
      },
      {
        label: 'Sysgraft (Curavest product)',
        href: 'https://sysgraft.com',
        description: 'AI integration for wholesale and distribution businesses.',
      },
    ],
  },
  { label: 'Track Record', href: '/track-record/' },
  { label: 'About', href: '/about/' },
];

export const PRIMARY_CTA = { label: 'Start a Conversation', href: '/start-a-conversation/' };

export const FOOTER_LINKS: NavChild[] = [
  { label: 'Home', href: '/' },
  { label: 'Services', href: '/services/' },
  { label: 'Fractional CTO Services', href: '/services/fractional-cto/' },
  { label: 'AI Integration Services', href: '/services/ai-integration/' },
  { label: 'How It Works', href: '/services/fractional-cto/how-it-works/' },
  { label: 'Who We Work With', href: '/services/fractional-cto/who-we-work-with/' },
  { label: 'Track Record', href: '/track-record/' },
  { label: 'About Curavest', href: '/about/' },
  { label: 'Start a Conversation', href: '/start-a-conversation/' },
  { label: 'Privacy Policy', href: '/privacy/' },
];
