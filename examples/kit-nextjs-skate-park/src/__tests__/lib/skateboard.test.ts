/** @jest-environment node */

import { BUDGET_SELECTION, calculateQuote, DEFAULT_SELECTION } from '../../lib/skateboard/catalog';
import { GET } from '../../app/api/skateboard/catalog/route';
import { POST } from '../../app/api/skateboard/quote/route';
import { POST as deliveryPOST } from '../../app/api/skateboard/delivery/route';

describe('Skateboard pricing', () => {
  it('includes complete sets, grip and hardware in the base total', () => {
    const quote = calculateQuote(DEFAULT_SELECTION);
    expect(quote.totalCents).toBe(14695);
    expect(quote.lines).toHaveLength(6);
    expect(quote.monthlyCents).toBe(0);
  });

  it('adds shipping to a budget setup and requires included insurance after an upgrade', () => {
    const budget = calculateQuote(BUDGET_SELECTION);
    expect(budget.subtotalCents).toBe(9700);
    expect(budget.totalCents).toBe(10195);
    expect(budget.delivery.remainingCents).toBe(10201);
    expect(budget.delivery.insured).toBe(false);
    const upgraded = calculateQuote({ ...DEFAULT_SELECTION, deck: 'cruiser', trucks: 'light', wheels: 'soft', assembly: true });
    expect(upgraded.totalCents).toBe(21200);
    expect(upgraded.delivery.insurance.required).toBe(true);
    expect(upgraded.delivery.insured).toBe(true);
    expect(upgraded.delivery.methods[0].priceCents).toBe(0);
  });

  it('prices optional transport cover separately from monthly cover', () => {
    const quote = calculateQuote({ ...BUDGET_SELECTION, transportInsurance: true, insurance: true });
    expect(quote.totalCents).toBe(10394);
    expect(quote.monthlyCents).toBe(499);
  });

  it('rejects unavailable shipping and forged delivery totals', () => {
    expect(() => calculateQuote({ ...DEFAULT_SELECTION, country: 'OTHER', shipping: 'express' })).toThrow(/verzendmethode/);
    expect(() => calculateQuote({ ...DEFAULT_SELECTION, shippingCents: 0 })).toThrow();
  });

  it('keeps recurring insurance separate from assembly and purchase price', () => {
    const quote = calculateQuote({ ...DEFAULT_SELECTION, assembly: true, insurance: true });
    expect(quote.totalCents).toBe(16195);
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
  it.each([
    [JSON.stringify({ ...DEFAULT_SELECTION, country: 'unknown' }), 'application/json', 400],
    [JSON.stringify({ ...DEFAULT_SELECTION, subtotalCents: 10000 }), 'application/json', 400],
    ['{', 'application/json', 400],
    ['{}', 'text/plain', 415],
  ])('rejects invalid delivery requests', async (body, contentType, status) => {
    const response = await deliveryPOST(new Request('http://localhost/api/skateboard/delivery', {
      method: 'POST', headers: { 'Content-Type': contentType }, body,
    }));
    expect(response.status).toBe(status);
  });

  it('returns dependent delivery options using server-owned prices', async () => {
    const request = new Request('http://localhost/api/skateboard/delivery', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...BUDGET_SELECTION, country: 'OTHER' }),
    });
    const response = await deliveryPOST(request);
    expect(response.status).toBe(200);
    expect(response.headers.get('Cache-Control')).toBe('no-store');
    const options = await response.json();
    expect(options.methods).toEqual([{ id: 'standard', name: 'Internationaal', priceCents: 2495 }]);
    expect(options.insurance.required).toBe(false);
  });

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