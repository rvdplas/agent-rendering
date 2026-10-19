import { getDeliveryOptions } from './delivery';
import type { DeliveryOptions, ShippingMethod } from './delivery';

export const CATALOG = [
  { id: 'deck', label: 'Deck', options: [
    { id: 'budget', name: 'Basic 8.0 inch', detail: 'Budgetdeck, esdoorn', priceCents: 2500 },
    { id: 'street', name: 'Street 8.0 inch', detail: 'Esdoorn, allround', priceCents: 5500 },
    { id: 'park', name: 'Park 8.25 inch', detail: 'Meer ruimte voor tricks', priceCents: 6500 },
    { id: 'cruiser', name: 'Cruiser 8.5 inch', detail: 'Breed en stabiel', priceCents: 7500 },
  ] },
  { id: 'trucks', label: 'Trucks', options: [
    { id: 'budget', name: 'Basic', detail: 'Compleet paar, instapmodel', priceCents: 2000 },
    { id: 'standard', name: 'Standard', detail: 'Passend paar bij het gekozen deck', priceCents: 3500 },
    { id: 'light', name: 'Hollow', detail: 'Lichtgewicht paar, passend bij het deck', priceCents: 5500 },
  ] },
  { id: 'wheels', label: 'Wielen', options: [
    { id: 'street', name: 'Street 52 mm / 99A', detail: 'Vier harde wielen voor tricks', priceCents: 2500 },
    { id: 'hybrid', name: 'Hybrid 54 mm / 90A', detail: 'Vier wielen voor park en straat', priceCents: 3500 },
    { id: 'soft', name: 'Cruise 54 mm / 80A', detail: 'Vier zachte wielen voor comfort', priceCents: 4000 },
  ] },
  { id: 'bearings', label: 'Lagers', options: [
    { id: 'standard', name: 'Standard steel', detail: 'Set van acht lagers', priceCents: 1500 },
    { id: 'premium', name: 'Premium steel', detail: 'Set van acht, afgedicht', priceCents: 2800 },
  ] },
] as const;

export type CategoryId = typeof CATALOG[number]['id'];
export type Selection = Record<CategoryId, string> & {
  assembly: boolean;
  insurance: boolean;
  country: string;
  shipping: string;
  transportInsurance: boolean;
};
export interface QuoteLine { id: string; name: string; priceCents: number }
interface ProductQuote { lines: QuoteLine[]; totalCents: number; monthlyCents: number; currency: 'EUR' }
export interface Quote extends ProductQuote {
  subtotalCents: number;
  delivery: DeliveryOptions & { selectedMethod: ShippingMethod; insured: boolean };
}

export const DEFAULT_SELECTION: Selection = {
  deck: 'street', trucks: 'standard', wheels: 'street', bearings: 'standard',
  assembly: false, insurance: false,
  country: 'NL', shipping: 'standard', transportInsurance: false,
};
export const BUDGET_SELECTION: Selection = { ...DEFAULT_SELECTION, deck: 'budget', trucks: 'budget' };
export const EXTRAS = {
  grip: { id: 'grip', name: 'Griptape en montagemateriaal', priceCents: 1200 },
  assembly: { id: 'assembly', name: 'Montage', priceCents: 1500 },
  insurance: { id: 'insurance', name: 'Fictieve verzekering', priceCents: 499 },
};
export const INSURANCE_TERMS = 'Fictief demoproduct, niet afsluitbaar. EUR 4,99 per maand; diefstal en schade, eigen risico EUR 50, maximaal EUR 250 per jaar. Geen dekking voor slijtage.';
export const money = (cents: number) => new Intl.NumberFormat('nl-NL', {
  style: 'currency', currency: 'EUR',
}).format(cents / 100);

export function calculateProductQuote(input: unknown): ProductQuote {
  if (!input || typeof input !== 'object' || Array.isArray(input)) {
    throw new Error('Geef een geldige configuratie op.');
  }
  const selection = input as Record<string, unknown>;
  const allowedKeys = [...CATALOG.map((category) => category.id), 'assembly', 'insurance', 'country', 'shipping', 'transportInsurance'];
  if (Object.keys(selection).some((key) => !allowedKeys.includes(key))) {
    throw new Error('Onbekend configuratieveld.');
  }
  if (typeof selection.assembly !== 'boolean' || typeof selection.insurance !== 'boolean') {
    throw new Error('Montage en verzekering moeten aan of uit staan.');
  }
  if (selection.transportInsurance !== undefined && typeof selection.transportInsurance !== 'boolean') {
    throw new Error('Transportverzekering moet aan of uit staan.');
  }
  const lines: QuoteLine[] = CATALOG.map((category) => {
    const option = category.options.find((item) => item.id === selection[category.id]);
    if (!option) throw new Error(`Ongeldige keuze voor ${category.label.toLowerCase()}.`);
    return { id: category.id, name: `${category.label}: ${option.name}`, priceCents: option.priceCents };
  });
  lines.push(EXTRAS.grip);
  if (selection.assembly) lines.push(EXTRAS.assembly);
  return {
    lines, totalCents: lines.reduce((total, line) => total + line.priceCents, 0),
    monthlyCents: selection.insurance ? EXTRAS.insurance.priceCents : 0, currency: 'EUR',
  };
}

export function getDeliveryOptionsForSelection(input: unknown): DeliveryOptions {
  const product = calculateProductQuote(input);
  const selection = input as Record<string, unknown>;
  return getDeliveryOptions(product.totalCents, selection.country ?? 'NL');
}

export function calculateQuote(input: unknown): Quote {
  const product = calculateProductQuote(input);
  const selection = input as Record<string, unknown>;
  const options = getDeliveryOptions(product.totalCents, selection.country ?? 'NL');
  const method = options.methods.find((item) => item.id === (selection.shipping ?? 'standard'));
  if (!method) throw new Error('Deze verzendmethode is niet beschikbaar voor de bestemming.');
  const insured = options.insurance.required || selection.transportInsurance === true;
  const lines = [...product.lines, { id: 'shipping', name: `Verzending: ${method.name}`, priceCents: method.priceCents }];
  if (insured) lines.push({ id: 'transportInsurance', name: options.insurance.required ? 'Transportverzekering (verplicht, inbegrepen)' : 'Transportverzekering', priceCents: options.insurance.priceCents });
  return {
    ...product,
    lines,
    subtotalCents: product.totalCents,
    totalCents: lines.reduce((total, line) => total + line.priceCents, 0),
    delivery: { ...options, selectedMethod: method.id, insured },
  };
}