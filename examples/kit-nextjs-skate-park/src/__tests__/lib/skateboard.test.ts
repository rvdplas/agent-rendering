/** @jest-environment node */

import { calculateQuote, DEFAULT_SELECTION } from '../../lib/skateboard/catalog';
import { GET } from '../../app/api/skateboard/catalog/route';
import { POST } from '../../app/api/skateboard/quote/route';

describe('Skateboard pricing', () => {
  it('includes complete sets, grip and hardware in the base total', () => {
    const quote = calculateQuote(DEFAULT_SELECTION);
    expect(quote.totalCents).toBe(14200);
    expect(quote.lines).toHaveLength(5);
    expect(quote.monthlyCents).toBe(0);
  });

  it('keeps recurring insurance separate from assembly and purchase price', () => {
    const quote = calculateQuote({ ...DEFAULT_SELECTION, assembly: true, insurance: true });
    expect(quote.totalCents).toBe(15700);
    expect(quote.monthlyCents).toBe(499);
  });

  it.each([null, [], {}, { ...DEFAULT_SELECTION, deck: 'fake' },
    { ...DEFAULT_SELECTION, insurance: 'false' }, { ...DEFAULT_SELECTION, priceCents: 1 }])(
    'rejects invalid selections or client-supplied prices: %j', (selection) => {
      expect(() => calculateQuote(selection)).toThrow();
    }
  );
});

describe('Skateboard API', () => {
  it('publishes the catalog, defaults and insurance terms', async () => {
    const response = GET();
    const catalog = await response.json();
    expect(catalog.categories).toHaveLength(4);
    expect(catalog.defaults).toEqual(DEFAULT_SELECTION);
    expect(catalog.insuranceTerms).toContain('Fictief');
  });

  it('returns the shared quote without caching', async () => {
    const response = await POST(new Request('http://localhost/api/skateboard/quote', {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(DEFAULT_SELECTION),
    }));
    expect(response.status).toBe(200);
    expect(response.headers.get('Cache-Control')).toBe('no-store');
    expect(await response.json()).toEqual(calculateQuote(DEFAULT_SELECTION));
  });

  it.each(['{', '{}', JSON.stringify({ ...DEFAULT_SELECTION, totalCents: 1 })])('rejects malformed or invalid input %s', async (body) => {
    const response = await POST(new Request('http://localhost/api/skateboard/quote', {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body,
    }));
    expect(response.status).toBe(400);
    expect(await response.json()).toHaveProperty('error');
  });

  it('rejects unsupported content types', async () => {
    const response = await POST(new Request('http://localhost/api/skateboard/quote', { method: 'POST', body: '{}' }));
    expect(response.status).toBe(415);
  });
});