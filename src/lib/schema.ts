// Structured data helpers (schema.org / JSON-LD), per the SEO/AEO
// implementation notes in the supplied copy specification.
import { SITE } from './site';

export function organizationSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    '@id': `${SITE.url}/#organization`,
    name: SITE.legalName,
    alternateName: SITE.name,
    url: SITE.url,
    logo: `${SITE.url}/icons/icon-512.png`,
    email: SITE.email,
    telephone: SITE.phoneLandline,
    founder: {
      '@type': 'Person',
      name: SITE.founder,
    },
    address: {
      '@type': 'PostalAddress',
      addressCountry: 'GB',
    },
    sameAs: [SITE.sysgraftUrl],
  };
}

export function personSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'Person',
    '@id': `${SITE.url}/#founder`,
    name: SITE.founder,
    jobTitle: 'Fractional CTO',
    worksFor: {
      '@type': 'Organization',
      name: SITE.legalName,
    },
    email: SITE.email,
    url: `${SITE.url}/about/`,
  };
}

export function professionalServiceSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'ProfessionalService',
    '@id': `${SITE.url}/#service-fractional-cto`,
    name: 'Curavest – Fractional CTO Services',
    description:
      'Part-time, embedded technology and process leadership for owners, MDs and boards of UK operational businesses.',
    provider: {
      '@type': 'Organization',
      name: SITE.legalName,
    },
    areaServed: {
      '@type': 'Country',
      name: 'United Kingdom',
    },
    audience: {
      '@type': 'BusinessAudience',
      audienceType: 'UK operational businesses, approximately £5m–£10m turnover',
    },
    url: `${SITE.url}/services/fractional-cto/`,
  };
}

export function aiIntegrationServiceSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'ProfessionalService',
    '@id': `${SITE.url}/#service-ai-integration`,
    name: 'Curavest – AI Integration Services',
    description:
      'Identifying where AI can genuinely improve an operational business, then designing and implementing it — understand, create, implement.',
    provider: {
      '@type': 'Organization',
      name: SITE.legalName,
    },
    areaServed: {
      '@type': 'Country',
      name: 'United Kingdom',
    },
    audience: {
      '@type': 'BusinessAudience',
      audienceType: 'UK operational businesses, approximately £5m–£10m turnover',
    },
    url: `${SITE.url}/services/ai-integration/`,
  };
}

export function websiteSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    '@id': `${SITE.url}/#website`,
    name: SITE.name,
    url: SITE.url,
    publisher: {
      '@id': `${SITE.url}/#organization`,
    },
    inLanguage: 'en-GB',
  };
}

export function breadcrumbSchema(items: { name: string; path: string }[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: new URL(item.path, SITE.url).toString(),
    })),
  };
}

export function faqSchema(items: { question: string; answer: string }[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: items.map((item) => ({
      '@type': 'Question',
      name: item.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: item.answer,
      },
    })),
  };
}

export function contactPageSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'ContactPage',
    '@id': `${SITE.url}/start-a-conversation/#contactpage`,
    name: 'Start a Conversation | Curavest',
    url: `${SITE.url}/start-a-conversation/`,
  };
}
