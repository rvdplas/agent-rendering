import { getDeliveryOptions } from '../../lib/skateboard/delivery';

describe('Delivery threshold and destinations', () => {
  it.each([
    [19899, false, 2],
    [19900, false, 1],
    [19901, true, 0],
  ])('calculates the strict threshold at %i cents', (subtotal, free, remaining) => {
    const result = getDeliveryOptions(subtotal, 'NL');
    expect(result.freeShipping).toBe(free);
    expect(result.remainingCents).toBe(remaining);
    expect(result.methods[0].priceCents).toBe(free ? 0 : 495);
    expect(result.insurance.required).toBe(free);
    expect(result.insurance.priceCents).toBe(free ? 0 : 199);
  });

  it('charges an express upgrade even when standard shipping is free', () => {
    expect(getDeliveryOptions(24200, 'NL').methods[1].priceCents).toBe(500);
  });

  it.each(['BE', 'DE', 'OTHER'])('does not promise free shipping outside NL: %s', (country) => {
    const options = getDeliveryOptions(24200, country);
    expect(options.freeShipping).toBe(false);
    expect(options.remainingCents).toBeNull();
    expect(options.methods[0].priceCents).toBeGreaterThan(0);
    expect(options.insurance.required).toBe(true);
  });

  it('has no express option outside the EU and discloses import costs', () => {
    const options = getDeliveryOptions(9800, 'OTHER');
    expect(options.methods.map((method) => method.id)).toEqual(['standard']);
    expect(options.notice).toContain('invoerrechten');
  });

  it('rejects unsupported countries and invalid subtotals', () => {
    expect(() => getDeliveryOptions(10000, 'unknown')).toThrow();
    expect(() => getDeliveryOptions(-1, 'NL')).toThrow();
  });
});