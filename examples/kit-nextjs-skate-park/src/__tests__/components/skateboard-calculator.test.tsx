import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { Default, SkateboardCalculator } from '../../components/skateboard-calculator/SkateboardCalculator';
import SkateboardPage from '../../app/[site]/[locale]/skateboard/page';
import { CATALOG, DEFAULT_SELECTION, calculateQuote, money } from '../../lib/skateboard/catalog';
import type { Selection } from '../../lib/skateboard/catalog';
import type { Page } from '../../lib/component-props';

const mockHeaders = jest.fn();
let mockConsumerMode = 'default';
jest.mock('next/headers', () => ({ headers: () => mockHeaders() }));
jest.mock('@sitecore-content-sdk/nextjs', () => ({
  useSitecore: () => ({ page: { consumer: { mode: mockConsumerMode } } }),
}));

const initialQuote = calculateQuote(DEFAULT_SELECTION);
const originalFetch = global.fetch;
const normalizedMoney = (cents: number) => money(cents).replace(/\s/g, ' ');

beforeEach(() => {
  mockConsumerMode = 'default';
  mockHeaders.mockResolvedValue({ get: () => 'Mozilla/5.0' });
  window.history.replaceState(null, '', '/skateboard');
  global.fetch = jest.fn(async (_url, options) => ({
    ok: true, json: async () => calculateQuote(JSON.parse(options?.body as string)),
  } as Response));
});

afterEach(() => { global.fetch = originalFetch; });

it('recalculates options through the API and shares the selection', async () => {
  render(<SkateboardCalculator initialSelection={DEFAULT_SELECTION} initialQuote={initialQuote} />);
  await waitFor(() => expect(screen.queryByRole('status')).not.toBeInTheDocument());
  fireEvent.click(screen.getByRole('checkbox', { name: /Rijklaar/ }));
  await waitFor(() => expect(screen.getByText(normalizedMoney(15700))).toBeInTheDocument());
  expect(window.location.search).toContain('assembly=true');
  expect(screen.getByRole('link', { name: /Agentweergave/ })).toHaveAttribute('href', expect.stringContaining('assembly=true'));
  fireEvent.click(screen.getByRole('checkbox', { name: /Verzekering/ }));
  await waitFor(() => expect(screen.queryByRole('status')).not.toBeInTheDocument());
  expect(screen.getByText(normalizedMoney(15700))).toBeInTheDocument();
  fireEvent.click(screen.getByRole('button', { name: /Reset/ }));
  await waitFor(() => expect(screen.getByText(normalizedMoney(14200))).toBeInTheDocument());
});

it('hides stale totals when pricing fails and offers retry', async () => {
  global.fetch = jest.fn().mockRejectedValue(new Error('Offline'));
  render(<SkateboardCalculator initialSelection={DEFAULT_SELECTION} initialQuote={initialQuote} />);
  expect(await screen.findByRole('alert')).toHaveTextContent('Offline');
  expect(screen.queryByText(normalizedMoney(14200))).not.toBeInTheDocument();
  expect(screen.getByRole('button', { name: 'Opnieuw proberen' })).toBeInTheDocument();
});

it('renders all options and the same quote in agent mode without interactive controls', async () => {
  const selection: Selection = { ...DEFAULT_SELECTION, assembly: true, insurance: true };
  const query = { ...Object.fromEntries(Object.entries(selection).map(([key, value]) => [key, String(value)])), view: 'agent' };
  render(await SkateboardPage({ searchParams: Promise.resolve(query) }));
  expect(screen.getByText(normalizedMoney(calculateQuote(selection).totalCents))).toBeInTheDocument();
  expect(screen.getAllByRole('table')).toHaveLength(2);
  expect(screen.queryByRole('radio')).not.toBeInTheDocument();
  expect(screen.queryByRole('checkbox')).not.toBeInTheDocument();
  expect(global.fetch).not.toHaveBeenCalled();
  for (const category of CATALOG) {
    for (const option of category.options) {
      expect(screen.getByText(`${option.name} (${category.id}=${option.id})`)).toBeInTheDocument();
    }
  }
});

it('automatically selects agent rendering for a recognized user agent', async () => {
  mockHeaders.mockResolvedValue({ get: () => 'ClaudeBot/1.0' });
  render(await SkateboardPage({ searchParams: Promise.resolve({}) }));
  expect(screen.getByRole('heading', { name: 'Alle beschikbare onderdelen' })).toBeInTheDocument();
});

it('supports the Sitecore SkateboardCalculator Default rendering in agent mode', () => {
  mockConsumerMode = 'agent';
  render(<Default params={{ RenderingIdentifier: 'custom-board' }} rendering={{ componentName: 'SkateboardCalculator' }} page={{ consumer: { mode: 'agent' } } as Page} />);
  expect(screen.getByRole('region', { name: 'Skateboard samenstellen' })).toHaveAttribute('id', 'custom-board');
  expect(screen.getAllByRole('table')).toHaveLength(2);
  expect(global.fetch).not.toHaveBeenCalled();
});

it('reports invalid shared configurations instead of silently changing prices', async () => {
  render(await SkateboardPage({ searchParams: Promise.resolve({ deck: 'missing' }) }));
  expect(screen.getByRole('heading', { name: 'Ongeldige configuratie' })).toBeInTheDocument();
});