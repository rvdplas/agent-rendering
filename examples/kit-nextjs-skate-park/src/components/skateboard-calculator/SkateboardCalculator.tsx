'use client';

import { useEffect, useId, useState } from 'react';
import { useSitecore } from '@sitecore-content-sdk/nextjs';
import { ArrowUpRight, RotateCcw, Wallet } from 'lucide-react';
import { Button } from 'components/ui/button';
import { getConsumerMode } from 'lib/consumer/consumer-mode';
import { BUDGET_SELECTION, CATALOG, DEFAULT_SELECTION, EXTRAS, INSURANCE_TERMS, calculateQuote, money } from 'lib/skateboard/catalog';
import { DELIVERY_THRESHOLD_CENTS, DESTINATIONS, getDeliveryOptions } from 'lib/skateboard/delivery';
import type { DeliveryOptions } from 'lib/skateboard/delivery';
import type { Quote, Selection } from 'lib/skateboard/catalog';
import type { SkateboardCalculatorProps, SkateboardCalculatorRenderingProps } from './skateboard-calculator.props';
import '../../app/[site]/[locale]/skateboard/skateboard.css';

export const Default = ({ params }: SkateboardCalculatorRenderingProps) => {
  const { page } = useSitecore();
  return <section className={`skate-page ${params?.styles || ''}`} id={params?.RenderingIdentifier} lang="nl" aria-label="Skateboard samenstellen">
    <SkateboardCalculator initialSelection={DEFAULT_SELECTION} initialQuote={calculateQuote(DEFAULT_SELECTION)} agent={getConsumerMode(page) === 'agent'} />
  </section>;
};

export function SkateboardCalculator(props: SkateboardCalculatorProps) {
  return props.agent ? <SkateboardAgent {...props} /> : <InteractiveCalculator {...props} />;
}

function InteractiveCalculator({ initialSelection, initialQuote }: SkateboardCalculatorProps) {
  const instanceId = useId();
  const [selection, setSelection] = useState(initialSelection);
  const [quote, setQuote] = useState<Quote>(initialQuote);
  const [deliveryOptions, setDeliveryOptions] = useState<DeliveryOptions | null>(null);
  const [pending, setPending] = useState(true);
  const [error, setError] = useState('');
  const [retry, setRetry] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    setPending(true);
    setDeliveryOptions(null);
    setError('');
    async function updateQuote() {
      try {
        const deliveryResponse = await fetch('/api/skateboard/delivery', {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(selection), signal: controller.signal,
        });
        if (!deliveryResponse.ok) throw new Error('De leveringsopties konden niet worden opgehaald. Probeer opnieuw.');
        const options: DeliveryOptions = await deliveryResponse.json();
        if (controller.signal.aborted) return;
        const resolvedSelection = {
          ...selection,
          shipping: options.methods.some((method) => method.id === selection.shipping)
            ? selection.shipping : options.methods[0].id,
        };
        if (resolvedSelection.shipping !== selection.shipping) {
          setSelection(resolvedSelection);
          return;
        }
        setDeliveryOptions(options);
        const response = await fetch('/api/skateboard/quote', {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(selection), signal: controller.signal,
        });
        if (!response.ok) throw new Error('De prijs kon niet worden berekend. Probeer opnieuw.');
        const result: Quote = await response.json();
        if (controller.signal.aborted) return;
        setQuote(result);
        const query = new URLSearchParams();
        Object.entries(selection).forEach(([key, value]) => query.set(key, String(value)));
        window.history.replaceState(null, '', `${window.location.pathname}?${query}`);
      } catch (failure) {
        if (!controller.signal.aborted) setError(failure instanceof Error ? failure.message : 'Verbindingsfout.');
      } finally {
        if (!controller.signal.aborted) setPending(false);
      }
    }
    void updateQuote();
    return () => controller.abort();
  }, [selection, retry]);

  function changeSelection(next: Selection) {
    setPending(true);
    setDeliveryOptions(null);
    setError('');
    setSelection(next);
  }

  const agentQuery = new URLSearchParams({
    ...Object.fromEntries(Object.entries(selection).map(([key, value]) => [key, String(value)])), view: 'agent',
  });

  return (
    <div className="skate-builder">
      <form className="skate-options" onSubmit={(event) => event.preventDefault()}>
        {CATALOG.map((category, index) => {
          const selectedPrice = category.options.find((option) => option.id === selection[category.id])?.priceCents ?? 0;
          return <fieldset key={category.id}>
            <legend><span className="skate-step">0{index + 1}</span>{category.label}</legend>
            <div className="skate-choices">
              {category.options.map((option) => {
                const selected = selection[category.id] === option.id;
                const difference = option.priceCents - selectedPrice;
                const adjustment = difference === 0 ? 'Zelfde prijs' : `${difference > 0 ? '+' : '-'} ${money(Math.abs(difference))}`;
                return <label className="skate-choice" key={option.id}>
                  <input type="radio" name={category.id} value={option.id}
                    checked={selected}
                    onChange={() => changeSelection({ ...selection, [category.id]: option.id })} />
                  <span><strong>{option.name}</strong><small>{option.detail}</small></span>
                  <span className="skate-option-price" title="Verschil in onderdeelprijs ten opzichte van je huidige keuze, exclusief levering">
                    <b className={selected ? 'skate-price-selected' : undefined}>{selected ? 'Geselecteerd' : adjustment}</b>
                    <small>{money(option.priceCents)}</small>
                  </span>
                </label>;
              })}
            </div>
          </fieldset>;
        })}
        <fieldset>
          <legend><span className="skate-step">05</span>Maak hem compleet</legend>
          <p className="skate-included">Griptape + montagemateriaal: {money(EXTRAS.grip.priceCents)} inbegrepen in het totaal.</p>
          <label className="skate-choice">
            <input type="checkbox" checked={selection.assembly}
              onChange={(event) => changeSelection({ ...selection, assembly: event.target.checked })} />
            <span><strong>Rijklaar laten monteren</strong><small>Alles gemonteerd en afgesteld</small></span>
            <b>{money(EXTRAS.assembly.priceCents)}</b>
          </label>
          <label className="skate-choice">
            <input type="checkbox" checked={selection.insurance} aria-describedby={`${instanceId}-insurance-terms`}
              onChange={(event) => changeSelection({ ...selection, insurance: event.target.checked })} />
            <span><strong>Verzekering (demo)</strong><small>Optioneel, maandelijks</small></span>
            <b>{money(EXTRAS.insurance.priceCents)}/mnd</b>
          </label>
          <p id={`${instanceId}-insurance-terms`} className="skate-terms">{INSURANCE_TERMS}</p>
        </fieldset>
        <fieldset>
          <legend><span className="skate-step">06</span>Bezorging</legend>
          <label className="skate-country" htmlFor={`${instanceId}-country`}>Bestemming</label>
          <select id={`${instanceId}-country`} value={selection.country}
            onChange={(event) => changeSelection({ ...selection, country: event.target.value, shipping: 'standard' })}>
            {DESTINATIONS.map((destination) => <option key={destination.id} value={destination.id}>{destination.name}</option>)}
          </select>
          {!deliveryOptions ? <p className="skate-terms">{error ? 'Leveringsopties niet beschikbaar.' : 'Leveringsopties ophalen...'}</p> : <>
            <div className="skate-choices">
              {deliveryOptions.methods.map((method) => <label className="skate-choice" key={method.id}>
                <input type="radio" name={`${instanceId}-shipping`} checked={selection.shipping === method.id}
                  onChange={() => changeSelection({ ...selection, shipping: method.id })} />
                <span><strong>{method.name}</strong></span><b>{money(method.priceCents)}</b>
              </label>)}
            </div>
            <label className="skate-choice">
              <input type="checkbox" checked={deliveryOptions.insurance.required || selection.transportInsurance}
                disabled={deliveryOptions.insurance.required} aria-describedby={`${instanceId}-transport-terms`}
                onChange={(event) => changeSelection({ ...selection, transportInsurance: event.target.checked })} />
              <span><strong>Transportverzekering</strong><small>{deliveryOptions.insurance.required ? `Verplicht en inbegrepen boven ${money(DELIVERY_THRESHOLD_CENTS)}` : 'Optioneel, eenmalig'}</small></span>
              <b>{money(deliveryOptions.insurance.priceCents)}</b>
            </label>
            <p id={`${instanceId}-transport-terms`} className="skate-terms">{deliveryOptions.insurance.terms}</p>
            <p className="skate-terms">{deliveryOptions.notice}</p>
          </>}
        </fieldset>
      </form>
      <aside className="skate-summary" aria-label="Jouw prijsoverzicht">
        <img className="skate-photo" src="https://images.unsplash.com/photo-1520045892732-304bc3ac5d8e?auto=format&fit=crop&w=900&q=85" alt="Skateboard met trucks en wielen op een betonnen rand" width="900" height="600" />
        <div className="skate-receipt" aria-live="polite" aria-busy={pending}>
          <h2>Jouw setup</h2>
          {pending ? <p role="status">Prijs berekenen...</p> : error ? (
            <div role="alert"><p>{error}</p><Button type="button" onClick={() => setRetry(retry + 1)}>Opnieuw proberen</Button></div>
          ) : <>
            <dl>{quote.lines.map((line) => <div key={line.id}><dt>{line.name}</dt><dd>{money(line.priceCents)}</dd></div>)}</dl>
            <p className="skate-terms">Subtotaal onderdelen en montage: {money(quote.subtotalCents)}.</p>
            <p className="skate-shipping-message">{quote.delivery.freeShipping
              ? quote.delivery.selectedMethod === 'standard'
                ? 'Gratis standaardverzending en inbegrepen transportverzekering.'
                : 'Gratis standaardverzending beschikbaar; je betaalt alleen de expresstoeslag en de transportverzekering is inbegrepen.'
              : quote.delivery.remainingCents !== null
                ? `Nog ${money(quote.delivery.remainingCents)} aan onderdelen of montage tot gratis verzending binnen Nederland.`
                : quote.delivery.notice}</p>
            <div className="skate-total"><span>Eenmalig</span><strong>{money(quote.totalCents)}</strong></div>
            <div className="skate-monthly"><span>Verzekering per maand</span><strong>{money(quote.monthlyCents)}</strong></div>
            <p className="skate-terms">Demoprijzen in EUR, inclusief btw. Geen bestelling of verzekeringsaanvraag.</p>
          </>}
        </div>
        <div className="skate-actions">
          <Button type="button" variant="outline" onClick={() => changeSelection({ ...BUDGET_SELECTION })}><Wallet aria-hidden="true" />Budgetsetup</Button>
          <Button type="button" variant="outline" onClick={() => changeSelection({ ...DEFAULT_SELECTION })}><RotateCcw aria-hidden="true" />Reset</Button>
          <Button asChild variant="outline"><a href={`/skateboard?${agentQuery}`}>Agentweergave<ArrowUpRight aria-hidden="true" /></a></Button>
        </div>
      </aside>
    </div>
  );
}

function SkateboardAgent({ initialSelection: selection, initialQuote: quote }: SkateboardCalculatorProps) {
  const budget = calculateQuote(BUDGET_SELECTION);
  return <section className="skate-agent">
    <h2>Gekozen configuratie</h2>
    <table><caption>Eenmalige kosten, inclusief btw (EUR)</caption><thead><tr><th scope="col">Onderdeel</th><th scope="col">Prijs</th></tr></thead>
      <tbody>{quote.lines.map((line) => <tr key={line.id}><th scope="row">{line.name}</th><td>{money(line.priceCents)}</td></tr>)}</tbody>
      <tfoot><tr><th scope="row">Totaal eenmalig</th><td>{money(quote.totalCents)}</td></tr></tfoot>
    </table>
    <p>Subtotaal onderdelen en montage: {money(quote.subtotalCents)}. Bestemming: {DESTINATIONS.find((destination) => destination.id === quote.delivery.country)?.name}. Verzendmethode: {quote.delivery.selectedMethod}.</p>
    <p>{quote.delivery.remainingCents !== null && quote.delivery.remainingCents > 0
      ? `Nog ${money(quote.delivery.remainingCents)} tot gratis standaardverzending binnen Nederland.`
      : quote.delivery.notice} Transportverzekering: {quote.delivery.insured ? 'geselecteerd' : 'niet geselecteerd'}{quote.delivery.insurance.required ? ', verplicht en inbegrepen' : ', optioneel'}.</p>
    <p>Verzekering: {selection.insurance ? 'geselecteerd' : 'niet geselecteerd'}. Maandpremie: {money(quote.monthlyCents)}. Niet inbegrepen in de eenmalige prijs.</p>
    <h2>Alle beschikbare onderdelen</h2>
    <table><caption>Democatalogus, inclusief btw (EUR)</caption><thead><tr><th scope="col">Onderdeel</th><th scope="col">Optie / ID</th><th scope="col">Specificatie</th><th scope="col">Prijs</th></tr></thead>
      <tbody>{CATALOG.flatMap((category) => category.options.map((option) => <tr key={`${category.id}-${option.id}`}><th scope="row">{category.label}</th><td>{option.name} ({category.id}={option.id})</td><td>{option.detail}</td><td>{money(option.priceCents)}</td></tr>))}</tbody>
    </table>
    <p>Verplicht: {EXTRAS.grip.name}, {money(EXTRAS.grip.priceCents)}. Optionele montage: {money(EXTRAS.assembly.priceCents)} eenmalig. Alle combinaties in deze democatalogus zijn toegestaan.</p>
    <h2>Alle verzendopties en transportverzekeringen</h2>
    <p>De grens is strikt boven {money(DELIVERY_THRESHOLD_CENTS)} aan onderdelen, griptape, montagemateriaal en montage. Verzendkosten, transportverzekering en maandpremie tellen niet mee. Bij exact {money(DELIVERY_THRESHOLD_CENTS)} is nog {money(1)} nodig. Gratis standaardverzending geldt alleen binnen Nederland; daarboven heeft express alleen een toeslag. Voor iedere bestemming is boven de grens transportverzekering verplicht en inbegrepen. Daaronder is zij optioneel en eenmalig.</p>
    <table><caption>Alle bestemmingen en prijsregels (EUR, inclusief btw)</caption>
      <thead><tr><th scope="col">Bestemming / ID</th><th scope="col">Subtotaal</th><th scope="col">Methode / ID</th><th scope="col">Verzending</th><th scope="col">Transportverzekering</th></tr></thead>
      <tbody>{DESTINATIONS.flatMap((destination) => [DELIVERY_THRESHOLD_CENTS, DELIVERY_THRESHOLD_CENTS + 1].flatMap((subtotal) => {
        const options = getDeliveryOptions(subtotal, destination.id);
        return options.methods.map((method) => <tr key={`${destination.id}-${subtotal}-${method.id}`}>
          <th scope="row">{destination.name} ({destination.id})</th>
          <td>{subtotal > DELIVERY_THRESHOLD_CENTS ? `Boven ${money(DELIVERY_THRESHOLD_CENTS)}` : `Tot en met ${money(DELIVERY_THRESHOLD_CENTS)}`}</td>
          <td>{method.name} ({method.id})</td><td>{money(method.priceCents)}</td>
          <td>{options.insurance.required ? 'Verplicht en inbegrepen' : `Optioneel: ${money(options.insurance.priceCents)}`}</td>
        </tr>);
      }))}</tbody>
    </table>
    <p>{quote.delivery.insurance.terms} Buiten de EU: geen express, eventuele invoerrechten en lokale belastingen zijn niet inbegrepen.</p>
    <p>Budgetvoorbeeld: deck budget, trucks budget, wielen street, lagers standard, zonder montage: {money(budget.subtotalCents)} subtotaal. Binnen Nederland nog {money(budget.delivery.remainingCents ?? 0)} tot gratis verzending.</p>
    <h2>Verzekering en voorwaarden</h2><p>{INSURANCE_TERMS}</p>
    <p>Dit is een demonstratie. Onderdelen en prijzen zijn fictief; bestellen is niet mogelijk.</p>
    <p><a href="/api/skateboard/catalog">Catalogus (JSON)</a></p>
    <p>Afhankelijke leveringsopties: POST /api/skateboard/delivery, Content-Type: application/json, met dezelfde selectie als de prijsberekening. De server berekent het subtotaal; stuur geen eigen prijzen mee.</p>
    <p>Prijsberekening: POST /api/skateboard/quote, Content-Type: application/json.</p><pre>{JSON.stringify(selection, null, 2)}</pre>
    <a href={`/skateboard?${new URLSearchParams(Object.entries(selection).map(([key, value]) => [key, String(value)]))}`}>Interactieve configurator</a>
  </section>;
}