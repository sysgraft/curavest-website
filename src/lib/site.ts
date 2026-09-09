// Central site data: URLs, navigation structure, and organisation details
// used across layouts, components and structured data.

export const SITE = {
  name: 'Curavest',
  legalName: 'Curavest Ltd',
  url: 'https://curavest.co.uk',
  tagline: 'Fractional CTO and related services for UK operational businesses',
  description:
    'Curavest offers several complementary services for UK operational businesses. Explore our fractional CTO service and related offerings to improve processes, output and technology decisions.',
  email: 'euan.pallister@curavest.co.uk',
  phoneLandline: '+441183913212',
  phoneLandlineDisplay: '+44 (0)118 391 3212',
  phoneMobile: '+447484094848',
  phoneMobileDisplay: '+44 (0)7484 094848',
  founder: 'Euan Pallister',
  locale: 'en_GB',
  sysgraftUrl: 'https://sysgraft.com',
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
        label: 'Who I Work With',
        href: '/services/fractional-cto/who-i-work-with/',
        description: 'The businesses and sectors we are the right fit for.',
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
  { label: 'How It Works', href: '/services/fractional-cto/how-it-works/' },
  { label: 'Who I Work With', href: '/services/fractional-cto/who-i-work-with/' },
  { label: 'Track Record', href: '/track-record/' },
  { label: 'About Curavest', href: '/about/' },
  { label: 'Start a Conversation', href: '/start-a-conversation/' },
  { label: 'Privacy Policy', href: '/privacy/' },
];
