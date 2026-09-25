import type { JsonLdValue } from 'src/lib/structured-data/jsonld';

export interface WebSiteSchema {
  '@context': 'https://schema.org';
  '@type': 'WebSite';
  name: string;
  url: string;
  description?: string;
  potentialAction?: {
    '@type': 'SearchAction';
    target: string;
    'query-input': string;
  };
}

export interface OrganizationSchema {
  '@context': 'https://schema.org';
  '@type': 'Organization';
  name: string;
  url: string;
  logo?: string;
  description?: string;
}

export function generateWebSiteSchema(
  siteName: string,
  siteUrl: string,
  description?: string
): JsonLdValue {
  const schema: { [key: string]: JsonLdValue } = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: siteName,
    url: siteUrl,
    potentialAction: {
      '@type': 'SearchAction',
      target: `${siteUrl}/search?q={search_term_string}`,
      'query-input': 'required name=search_term_string',
    } as JsonLdValue,
  };

  if (description) {
    schema.description = description as JsonLdValue;
  }

  return schema as JsonLdValue;
}

export function generateOrganizationSchema(
  name: string,
  url: string,
  logo?: string,
  description?: string
): JsonLdValue {
  const schema: { [key: string]: JsonLdValue } = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name,
    url,
  };

  if (logo) {
    schema.logo = logo as JsonLdValue;
  }
  if (description) {
    schema.description = description as JsonLdValue;
  }

  return schema as JsonLdValue;
}

export type ArticleJsonLd = {
  '@context': 'https://schema.org';
  '@type': 'Article';
  headline?: string;
  articleBody?: string;
  inLanguage?: string;
};

export type ProductJsonLd = {
  '@context': 'https://schema.org';
  '@type': 'Product';
  name?: string;
  description?: string;
  image?: string | string[];
  url?: string;
  offers?: {
    '@type': 'Offer';
    price?: string;
    priceCurrency?: string;
  };
};

// Best-effort mapping from a formatted price string (e.g. "$149.99") to schema.org Offer fields.
const CURRENCY_SYMBOLS: Record<string, string> = { $: 'USD', '\u20ac': 'EUR', '\u00a3': 'GBP' };

export function parsePriceText(rawInput: string | number): { price?: string; priceCurrency?: string } {
  // Some Price fields resolve as Number rather than Text, so normalize before string ops.
  const raw = String(rawInput);
  const symbol = Object.keys(CURRENCY_SYMBOLS).find((s) => raw.includes(s));
  const numeric = raw.replace(/[^0-9.,]/g, '').replace(',', '.');

  return {
    price: numeric || undefined,
    priceCurrency: symbol ? CURRENCY_SYMBOLS[symbol] : undefined,
  };
}

export type PlaceJsonLd = {
  '@context': 'https://schema.org';
  '@type': 'Place';
  name?: string;
  address?: JsonLdValue;
  geo?: JsonLdValue;
  url?: string;
};

export type FaqPageJsonLd = {
  '@context': 'https://schema.org';
  '@type': 'FAQPage';
  mainEntity: Array<{
    '@type': 'Question';
    name: string;
    acceptedAnswer: { '@type': 'Answer'; text: string };
  }>;
};

// Common named entities from CMS rich text; numeric entities (&#233; / &#xe9;) are decoded separately below.
const NAMED_HTML_ENTITIES: Record<string, string> = {
  amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ',
  eacute: '\u00e9', egrave: '\u00e8', ecirc: '\u00ea', euml: '\u00eb',
  aacute: '\u00e1', agrave: '\u00e0', acirc: '\u00e2', auml: '\u00e4',
  iacute: '\u00ed', igrave: '\u00ec', icirc: '\u00ee', iuml: '\u00ef',
  oacute: '\u00f3', ograve: '\u00f2', ocirc: '\u00f4', ouml: '\u00f6',
  uacute: '\u00fa', ugrave: '\u00f9', ucirc: '\u00fb', uuml: '\u00fc',
  ntilde: '\u00f1', ccedil: '\u00e7',
};

const decodeHtmlEntities = (text: string): string =>
  text
    .replace(/&#(\d+);/g, (_, dec) => String.fromCharCode(Number(dec)))
    .replace(/&#x([0-9a-f]+);/gi, (_, hex) => String.fromCharCode(parseInt(hex, 16)))
    .replace(/&([a-zA-Z]+);/g, (match, name) => NAMED_HTML_ENTITIES[name.toLowerCase()] ?? match);

const stripHtml = (html: string): string =>
  decodeHtmlEntities(
    html
      .replace(/<script[\s\S]*?>[\s\S]*?<\/script[^>]*>/gi, ' ')
      .replace(/<style[\s\S]*?>[\s\S]*?<\/style[^>]*>/gi, ' ')
      .replace(/<[^>]+>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()
  );

const extractFaqEntriesFromHtml = (html?: string): Array<{ question: string; answer: string }> => {
  if (!html) return [];

  const entries: Array<{ question: string; answer: string }> = [];
  const detailsRe =
    /<details[\s\S]*?>[\s\S]*?<summary[^>]*>([\s\S]*?)<\/summary>([\s\S]*?)<\/details>/gi;
  const strip = (v: string) =>
    v
      .replace(/<[^>]+>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();

  let match: RegExpExecArray | null;
  while ((match = detailsRe.exec(html)) !== null) {
    const question = strip(match[1] ?? '');
    const answer = strip(match[2] ?? '');
    if (question && answer) entries.push({ question, answer });
  }

  return entries;
};

const extractAddressTextFromHtml = (html?: string): string | undefined => {
  if (!html) return undefined;
  const match = /<address[^>]*>([\s\S]*?)<\/address>/i.exec(html);
  if (!match?.[1]) return undefined;
  const addressText = match[1]
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  return addressText || undefined;
};

export function buildArticleJsonLd(input: {
  headline?: string;
  articleBodyHtml?: string;
  inLanguage?: string;
}): ArticleJsonLd {
  const articleBody = input.articleBodyHtml ? stripHtml(input.articleBodyHtml) : undefined;

  return {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: input.headline,
    articleBody,
    inLanguage: input.inLanguage,
  };
}

export function buildProductJsonLd(input: {
  name?: string;
  descriptionHtml?: string;
  image?: string | string[];
  url?: string;
  priceText?: string | number;
}): ProductJsonLd {
  const description = input.descriptionHtml ? stripHtml(input.descriptionHtml) : undefined;
  const { price, priceCurrency } = input.priceText != null ? parsePriceText(input.priceText) : {};

  return {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: input.name,
    description,
    image: input.image,
    url: input.url || undefined,
    offers: price ? { '@type': 'Offer', price, priceCurrency } : undefined,
  };
}

export function buildPlaceJsonLd(input: {
  name?: string;
  html?: string;
  address?: JsonLdValue;
  geo?: JsonLdValue;
  url?: string;
}): PlaceJsonLd | null {
  const addressText = extractAddressTextFromHtml(input.html);
  const address = input.address ?? (addressText ? { '@type': 'PostalAddress', streetAddress: addressText } : undefined);

  if (!address) {
    return null;
  }

  return {
    '@context': 'https://schema.org',
    '@type': 'Place',
    name: input.name,
    address,
    geo: input.geo,
    url: input.url,
  };
}

export function buildFaqPageJsonLd(input: {
  html?: string;
  mainEntity?: Array<{ question: string; answer: string }>;
}): FaqPageJsonLd | null {
  const faqEntries = input.mainEntity ?? extractFaqEntriesFromHtml(input.html);
  
  if (faqEntries.length === 0) {
    return null;
  }

  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqEntries.map(({ question, answer }) => ({
      '@type': 'Question',
      name: question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: answer,
      },
    })),
  };
}
 