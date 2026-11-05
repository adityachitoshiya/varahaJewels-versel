// Brand facts shared by the structured data (JSON-LD) on the homepage and
// About page, so Google and AI assistants read the same founder details.
// Keep this to verifiable facts only.

export const SITE = 'https://www.varahajewels.in';

export const FOUNDERS = [
  { name: 'Aditya Chitoshiya', role: 'Co-founder' },
  { name: 'Shivangi', role: 'Co-founder' },
];

export const organizationLd = {
  '@context': 'https://schema.org',
  '@type': 'Organization',
  '@id': `${SITE}/#organization`,
  name: 'Varaha Jewels',
  alternateName: 'Varaha Jewellery',
  url: SITE,
  logo: `${SITE}/varaha-assets/logo.png`,
  description: 'Varaha Jewels is an online Indian jewellery store from Jaipur, Rajasthan, selling Kundan and American Diamond necklace sets, earrings, 925 sterling silver pendants, rudraksha malas, watches and potli bags.',
  founder: FOUNDERS.map((f) => ({ '@type': 'Person', name: f.name, jobTitle: f.role, worksFor: { '@id': `${SITE}/#organization` } })),
  foundingLocation: { '@type': 'Place', name: 'Jaipur, Rajasthan, India' },
  address: { '@type': 'PostalAddress', addressLocality: 'Jaipur', addressRegion: 'Rajasthan', addressCountry: 'IN' },
  areaServed: 'IN',
  contactPoint: {
    '@type': 'ContactPoint',
    contactType: 'customer service',
    email: 'help@varahajewels.in',
    areaServed: 'IN',
    availableLanguage: ['en', 'hi'],
  },
};
