'use client';

import { useEffect, useState } from 'react';
import { useSitecore } from '@sitecore-content-sdk/nextjs';
import { ArrowUpRight, RotateCcw } from 'lucide-react';
import { Button } from 'components/ui/button';
import { getConsumerMode } from 'lib/consumer/consumer-mode';
import { CATALOG, DEFAULT_SELECTION, EXTRAS, INSURANCE_TERMS, calculateQuote, money } from 'lib/skateboard/catalog';
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
  const [selection, setSelection] = useState(initialSelection);
  const [quote, setQuote] = useState<Quote>(initialQuote);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState('');
  const [retry, setRetry] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    setPending(true);
    setError('');
    async function updateQuote() {
      try {
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
    setSelection(next);
  }

  const agentQuery = new URLSearchParams({
    ...Object.fromEntries(Object.entries(selection).map(([key, value]) => [key, String(value)])), view: 'agent',
  });

  return (
    <div className="skate-builder">
      <form className="skate-options" onSubmit={(event) => event.preventDefault()}>
        {CATALOG.map((category, index) => (
          <fieldset key={category.id}>
            <legend><span className="skate-step">0{index + 1}</span>{category.label}</legend>
            <div className="skate-choices">
              {category.options.map((option) => (
                <label className="skate-choice" key={option.id}>
                  <input type="radio" name={category.id} value={option.id}
                    checked={selection[category.id] === option.id}
                    onChange={() => changeSelection({ ...selection, [category.id]: option.id })} />
                  <span><strong>{option.name}</strong><small>{option.detail}</small></span>
                  <b>{money(option.priceCents)}</b>
                </label>
              ))}
            </div>
          </fieldset>
        ))}
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
            <input type="checkbox" checked={selection.insurance} aria-describedby="insurance-terms"
              onChange={(event) => changeSelection({ ...selection, insurance: event.target.checked })} />
            <span><strong>Verzekering (demo)</strong><small>Optioneel, maandelijks</small></span>
            <b>{money(EXTRAS.insurance.priceCents)}/mnd</b>
          </label>
          <p id="insurance-terms" className="skate-terms">{INSURANCE_TERMS}</p>
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
            <div className="skate-total"><span>Eenmalig</span><strong>{money(quote.totalCents)}</strong></div>
            <div className="skate-monthly"><span>Verzekering per maand</span><strong>{money(quote.monthlyCents)}</strong></div>
            <p className="skate-terms">Demoprijzen in EUR, inclusief btw. Geen bestelling of verzekeringsaanvraag.</p>
          </>}
        </div>
        <div className="skate-actions">
          <Button type="button" variant="outline" onClick={() => changeSelection({ ...DEFAULT_SELECTION })}><RotateCcw aria-hidden="true" />Reset</Button>
          <Button asChild variant="outline"><a href={`/skateboard?${agentQuery}`}>Agentweergave<ArrowUpRight aria-hidden="true" /></a></Button>
        </div>
      </aside>
    </div>
  );
}

function SkateboardAgent({ initialSelection: selection, initialQuote: quote }: SkateboardCalculatorProps) {
  return <section className="skate-agent">
    <h2>Gekozen configuratie</h2>
    <table><caption>Eenmalige kosten, inclusief btw (EUR)</caption><thead><tr><th scope="col">Onderdeel</th><th scope="col">Prijs</th></tr></thead>
      <tbody>{quote.lines.map((line) => <tr key={line.id}><th scope="row">{line.name}</th><td>{money(line.priceCents)}</td></tr>)}</tbody>
      <tfoot><tr><th scope="row">Totaal eenmalig</th><td>{money(quote.totalCents)}</td></tr></tfoot>
    </table>
    <p>Verzekering: {selection.insurance ? 'geselecteerd' : 'niet geselecteerd'}. Maandpremie: {money(quote.monthlyCents)}. Niet inbegrepen in de eenmalige prijs.</p>
    <h2>Alle beschikbare onderdelen</h2>
    <table><caption>Democatalogus, inclusief btw (EUR)</caption><thead><tr><th scope="col">Onderdeel</th><th scope="col">Optie / ID</th><th scope="col">Specificatie</th><th scope="col">Prijs</th></tr></thead>
      <tbody>{CATALOG.flatMap((category) => category.options.map((option) => <tr key={`${category.id}-${option.id}`}><th scope="row">{category.label}</th><td>{option.name} ({category.id}={option.id})</td><td>{option.detail}</td><td>{money(option.priceCents)}</td></tr>))}</tbody>
    </table>
    <p>Verplicht: {EXTRAS.grip.name}, {money(EXTRAS.grip.priceCents)}. Optionele montage: {money(EXTRAS.assembly.priceCents)} eenmalig. Alle combinaties in deze democatalogus zijn toegestaan.</p>
    <h2>Verzekering en voorwaarden</h2><p>{INSURANCE_TERMS}</p>
    <p>Dit is een demonstratie. Onderdelen en prijzen zijn fictief; bestellen is niet mogelijk.</p>
    <p><a href="/api/skateboard/catalog">Catalogus (JSON)</a></p>
    <p>Prijsberekening: POST /api/skateboard/quote, Content-Type: application/json.</p><pre>{JSON.stringify(selection, null, 2)}</pre>
    <a href={`/skateboard?${new URLSearchParams(Object.entries(selection).map(([key, value]) => [key, String(value)]))}`}>Interactieve configurator</a>
  </section>;
}