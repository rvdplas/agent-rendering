export const DELIVERY_THRESHOLD_CENTS = 19900;
export const DESTINATIONS = [
  { id: 'NL', name: 'Nederland', standardCents: 495, expressCents: 995, insuranceCents: 199 },
  { id: 'BE', name: 'Belgie', standardCents: 895, expressCents: 1695, insuranceCents: 299 },
  { id: 'DE', name: 'Duitsland', standardCents: 895, expressCents: 1695, insuranceCents: 299 },
  { id: 'OTHER', name: 'Buiten de EU', standardCents: 2495, expressCents: null, insuranceCents: 499 },
] as const;

export type DestinationId = typeof DESTINATIONS[number]['id'];
export type ShippingMethod = 'standard' | 'express';
export interface DeliveryOptions {
  country: DestinationId;
  subtotalCents: number;
  freeShipping: boolean;
  remainingCents: number | null;
  methods: { id: ShippingMethod; name: string; priceCents: number }[];
  insurance: { required: boolean; priceCents: number; terms: string };
  notice: string;
}

export function getDeliveryOptions(subtotalCents: number, country: unknown): DeliveryOptions {
  if (!Number.isSafeInteger(subtotalCents) || subtotalCents < 0) {
    throw new Error('Ongeldig subtotaal.');
  }
  const destination = DESTINATIONS.find((item) => item.id === country);
  if (!destination) throw new Error('Onbekende bestemming.');
  const aboveThreshold = subtotalCents > DELIVERY_THRESHOLD_CENTS;
  const freeShipping = destination.id === 'NL' && aboveThreshold;
  const methods: DeliveryOptions['methods'] = [
    { id: 'standard', name: destination.id === 'OTHER' ? 'Internationaal' : 'Standaard', priceCents: freeShipping ? 0 : destination.standardCents },
  ];
  if (destination.expressCents !== null) {
    methods.push({ id: 'express', name: 'Express', priceCents: freeShipping ? destination.expressCents - destination.standardCents : destination.expressCents });
  }
  return {
    country: destination.id,
    subtotalCents,
    freeShipping,
    remainingCents: destination.id === 'NL' ? Math.max(0, DELIVERY_THRESHOLD_CENTS + 1 - subtotalCents) : null,
    methods,
    insurance: {
      required: aboveThreshold,
      priceCents: aboveThreshold ? 0 : destination.insuranceCents,
      terms: 'Fictieve transportverzekering, alleen voor verlies of schade tijdens verzending. Dekking tot het subtotaal van deze bestelling. Geen maandpremie; niet los afsluitbaar.',
    },
    notice: destination.id === 'OTHER'
      ? 'Geen express. Eventuele invoerrechten en lokale belastingen zijn niet inbegrepen.'
      : destination.id === 'NL'
        ? `Gratis standaardverzending bij een subtotaal boven EUR ${DELIVERY_THRESHOLD_CENTS / 100}. Express heeft dan alleen een toeslag.`
        : 'Gratis verzending geldt alleen binnen Nederland.',
  };
}