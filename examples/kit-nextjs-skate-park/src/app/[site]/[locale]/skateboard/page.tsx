import { headers } from 'next/headers';
import { SkateboardCalculator } from 'components/skateboard-calculator/SkateboardCalculator';
import { detectConsumerMode } from 'lib/consumer/consumer-mode';
import { CATALOG, DEFAULT_SELECTION, calculateQuote } from 'lib/skateboard/catalog';
import type { Selection } from 'lib/skateboard/catalog';
import './skateboard.css';

export const metadata = { title: 'Stel je skateboard samen | Skate Lab', description: 'Stel een skateboard samen en bekijk alle onderdelen en kosten.' };

export default async function SkateboardPage({ searchParams }: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const query = await searchParams;
  const agent = query.view === 'agent' || detectConsumerMode(await headers()).mode === 'agent';
  const selection: Selection = { ...DEFAULT_SELECTION };
  let invalid = false;
  for (const category of CATALOG) {
    const value = query[category.id];
    if (value !== undefined) {
      if (typeof value !== 'string') invalid = true;
      else selection[category.id] = value;
    }
  }
  for (const key of ['country', 'shipping'] as const) {
    if (query[key] !== undefined) {
      if (typeof query[key] !== 'string') invalid = true;
      else selection[key] = query[key];
    }
  }
  for (const key of ['assembly', 'insurance', 'transportInsurance'] as const) {
    if (query[key] !== undefined) {
      if (query[key] !== 'true' && query[key] !== 'false') invalid = true;
      selection[key] = query[key] === 'true';
    }
  }
  let quote;
  try {
    if (invalid) throw new Error('Ongeldige configuratie.');
    quote = calculateQuote(selection);
  } catch {
    return <main className="skate-page" lang="nl"><h1>Ongeldige configuratie</h1><p>Een of meer keuzes bestaan niet.</p><a href="?">Begin opnieuw</a></main>;
  }

  return <main className="skate-page" lang="nl">
    <header className="skate-header"><a href="?" className="skate-brand">SKATE LAB<span>BUILD / RIDE / REPEAT</span></a><span>Custom boards / Demo</span></header>
    <section className="skate-intro"><p className="skate-eyebrow">YOUR BOARD. YOUR RULES.</p><h1>Stel je skateboard samen.</h1><p>Van je eerste ollie tot je dagelijkse rit.</p></section>
    <SkateboardCalculator initialSelection={selection} initialQuote={quote} agent={agent} />
    <footer className="skate-footer">SKATE LAB / DEMO COLLECTION 2026<span>Onderdelen kiezen. Klaar om te rollen.</span></footer>
  </main>;
}