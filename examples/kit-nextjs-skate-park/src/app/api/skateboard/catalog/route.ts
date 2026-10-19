import { CATALOG, DEFAULT_SELECTION, EXTRAS, INSURANCE_TERMS } from 'lib/skateboard/catalog';

export function GET() {
  return Response.json({
    categories: CATALOG, extras: EXTRAS, defaults: DEFAULT_SELECTION,
    currency: 'EUR', pricesIncludeVat: true, demo: true, insuranceTerms: INSURANCE_TERMS,
  });
}