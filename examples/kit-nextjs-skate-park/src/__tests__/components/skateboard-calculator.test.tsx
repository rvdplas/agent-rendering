import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { Default, SkateboardCalculator } from '../../components/skateboard-calculator/SkateboardCalculator';
import SkateboardPage from '../../app/[site]/[locale]/skateboard/page';
import { CATALOG, DEFAULT_SELECTION, calculateQuote, getDeliveryOptionsForSelection, money } from '../../lib/skateboard/catalog';
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
  global.fetch = jest.fn(async (url, options) => ({
    ok: true, json: async () => url === '/api/skateboard/delivery'
      ? getDeliveryOptionsForSelection(JSON.parse(options?.body as string))
      : calculateQuote(JSON.parse(options?.body as string)),
  } as Response));
});

afterEach(() => { global.fetch = originalFetch; });

it('shows category price differences relative to the current selection and preserves absolute prices', async () => {
  render(<SkateboardCalculator initialSelection={DEFAULT_SELECTION} initialQuote={initialQuote} />);
  await waitFor(() => expect(screen.queryByRole('status')).not.toBeInTheDocument());
  expect(screen.getByRole('radio', { name: /Park 8.25/ })).toHaveAccessibleName(/\+.*10,00.*65,00/);
  expect(screen.getByRole('radio', { name: /Basic 8.0/ })).toHaveAccessibleName(/-.*30,00.*25,00/);
  expect(screen.getByRole('radio', { name: /Street 8.0/ })).toHaveAccessibleName(/Geselecteerd.*55,00/);
  fireEvent.click(screen.getByRole('radio', { name: /Cruiser 8.5/ }));
  expect(screen.getByRole('radio', { name: /Cruiser 8.5/ })).toHaveAccessibleName(/Geselecteerd.*75,00/);
  expect(screen.getByRole('radio', { name: /Park 8.25/ })).toHaveAccessibleName(/-.*10,00.*65,00/);
  expect(screen.getByRole('radio', { name: /Street 8.0/ })).toHaveAccessibleName(/-.*20,00.*55,00/);
  expect(screen.getByRole('radio', { name: /Hollow/ })).toHaveAccessibleName(/\+.*20,00.*55,00/);
  await waitFor(() => expect(screen.queryByRole('status')).not.toBeInTheDocument());
});

it('fetches delivery options before showing them and updates the free-shipping threshold', async () => {
  const selection = { ...DEFAULT_SELECTION, deck: 'cruiser', trucks: 'light', wheels: 'soft' };
  render(<SkateboardCalculator initialSelection={selection} initialQuote={calculateQuote(selection)} />);
  expect(screen.queryByRole('radio', { name: /Express/ })).not.toBeInTheDocument();
  await waitFor(() => expect(screen.queryByRole('status')).not.toBeInTheDocument());
  expect(global.fetch).toHaveBeenNthCalledWith(1, '/api/skateboard/delivery', expect.anything());
  expect(global.fetch).toHaveBeenNthCalledWith(2, '/api/skateboard/quote', expect.anything());
  expect(screen.getByText(/Nog.*2,01.*tot gratis verzending/)).toBeInTheDocument();
  expect(screen.getByRole('checkbox', { name: /^Transportverzekering/ })).not.toBeDisabled();
  fireEvent.click(screen.getByRole('checkbox', { name: /Rijklaar/ }));
  await waitFor(() => expect(screen.queryByRole('status')).not.toBeInTheDocument());
  expect(screen.getByText('Gratis standaardverzending en inbegrepen transportverzekering.')).toBeInTheDocument();
  expect(screen.getByRole('checkbox', { name: /^Transportverzekering/ })).toBeChecked();
  expect(screen.getByRole('checkbox', { name: /^Transportverzekering/ })).toBeDisabled();
  expect(screen.queryByText(/Nog.*tot gratis verzending/)).not.toBeInTheDocument();
  expect(screen.getByText(normalizedMoney(21200))).toBeInTheDocument();
});

it('reloads delivery options on country changes and clears an unavailable express choice', async () => {
  render(<SkateboardCalculator initialSelection={DEFAULT_SELECTION} initialQuote={initialQuote} />);
  await waitFor(() => expect(screen.queryByRole('status')).not.toBeInTheDocument());
  fireEvent.click(screen.getByRole('radio', { name: /Express/ }));
  await waitFor(() => expect(screen.queryByRole('status')).not.toBeInTheDocument());
  expect(screen.getByText(normalizedMoney(15195))).toBeInTheDocument();
  fireEvent.change(screen.getByRole('combobox', { name: 'Bestemming' }), { target: { value: 'OTHER' } });
  expect(screen.queryByRole('radio', { name: /Express/ })).not.toBeInTheDocument();
  await waitFor(() => expect(screen.queryByRole('status')).not.toBeInTheDocument());
  expect(screen.getByRole('radio', { name: /Internationaal/ })).toBeChecked();
  expect(screen.queryByRole('radio', { name: /Express/ })).not.toBeInTheDocument();
  expect(screen.getByText(normalizedMoney(16695))).toBeInTheDocument();
  expect(screen.queryByText(/Nog.*tot gratis verzending/)).not.toBeInTheDocument();
  expect(window.location.search).toContain('country=OTHER');
  expect(window.location.search).toContain('shipping=standard');
});

it('ignores an outdated delivery response after a second country change', async () => {
  const normalFetch = global.fetch;
  let resolveBelgium: (response: Response) => void = () => { throw new Error('No delayed request'); };
  global.fetch = jest.fn((url, options) => {
    if (url === '/api/skateboard/delivery' && JSON.parse(options?.body as string).country === 'BE') {
      return new Promise<Response>((resolve) => { resolveBelgium = resolve; });
    }
    return normalFetch(url, options);
  });
  render(<SkateboardCalculator initialSelection={DEFAULT_SELECTION} initialQuote={initialQuote} />);
  await waitFor(() => expect(screen.queryByRole('status')).not.toBeInTheDocument());
  fireEvent.change(screen.getByRole('combobox', { name: 'Bestemming' }), { target: { value: 'BE' } });
  fireEvent.change(screen.getByRole('combobox', { name: 'Bestemming' }), { target: { value: 'OTHER' } });
  await waitFor(() => expect(screen.queryByRole('status')).not.toBeInTheDocument());
  await act(async () => {
    resolveBelgium({ ok: true, json: async () => getDeliveryOptionsForSelection({ ...DEFAULT_SELECTION, country: 'BE' }) } as Response);
  });
  expect(screen.getByRole('radio', { name: /Internationaal/ })).toBeChecked();
  expect(screen.queryByRole('radio', { name: /Express/ })).not.toBeInTheDocument();
  expect(screen.getByText(normalizedMoney(16695))).toBeInTheDocument();
});

it('recalculates options through the API and shares the selection', async () => {
  render(<SkateboardCalculator initialSelection={DEFAULT_SELECTION} initialQuote={initialQuote} />);
  await waitFor(() => expect(screen.queryByRole('status')).not.toBeInTheDocument());
  fireEvent.click(screen.getByRole('checkbox', { name: /Rijklaar/ }));
  await waitFor(() => expect(screen.getByText(normalizedMoney(16195))).toBeInTheDocument());
  expect(window.location.search).toContain('assembly=true');
  expect(screen.getByRole('link', { name: /Agentweergave/ })).toHaveAttribute('href', expect.stringContaining('assembly=true'));
  fireEvent.click(screen.getByRole('checkbox', { name: /Verzekering/ }));
  await waitFor(() => expect(screen.queryByRole('status')).not.toBeInTheDocument());
  expect(screen.getByText(normalizedMoney(16195))).toBeInTheDocument();
  fireEvent.click(screen.getByRole('button', { name: /Reset/ }));
  await waitFor(() => expect(screen.getByText(normalizedMoney(14695))).toBeInTheDocument());
});

it('hides stale totals when pricing fails and offers retry', async () => {
  const normalFetch = global.fetch;
  global.fetch = jest.fn().mockRejectedValue(new Error('Offline'));
  render(<SkateboardCalculator initialSelection={DEFAULT_SELECTION} initialQuote={initialQuote} />);
  expect(await screen.findByRole('alert')).toHaveTextContent('Offline');
  expect(screen.queryByText(normalizedMoney(14695))).not.toBeInTheDocument();
  expect(screen.getByRole('button', { name: 'Opnieuw proberen' })).toBeInTheDocument();
  expect(screen.queryByRole('radio', { name: /Express/ })).not.toBeInTheDocument();
  global.fetch = normalFetch;
  fireEvent.click(screen.getByRole('button', { name: 'Opnieuw proberen' }));
  await waitFor(() => expect(screen.queryByRole('status')).not.toBeInTheDocument());
  expect(screen.getByRole('radio', { name: /Express/ })).toBeInTheDocument();
  expect(screen.getByText(normalizedMoney(14695))).toBeInTheDocument();
});

it('renders all options and the same quote in agent mode without interactive controls', async () => {
  const selection: Selection = { ...DEFAULT_SELECTION, assembly: true, insurance: true };
  const query = { ...Object.fromEntries(Object.entries(selection).map(([key, value]) => [key, String(value)])), view: 'agent' };
  render(await SkateboardPage({ searchParams: Promise.resolve(query) }));
  expect(screen.getByText(normalizedMoney(calculateQuote(selection).totalCents))).toBeInTheDocument();
  expect(screen.getAllByRole('table')).toHaveLength(3);
  expect(screen.queryByRole('radio')).not.toBeInTheDocument();
  expect(screen.queryByRole('checkbox')).not.toBeInTheDocument();
  expect(global.fetch).not.toHaveBeenCalled();
  expect(screen.getByRole('heading', { name: 'Alle verzendopties en transportverzekeringen' })).toBeInTheDocument();
  expect(screen.getByText(/Bij exact.*199,00 is nog.*0,01 nodig/)).toBeInTheDocument();
  expect(screen.getAllByText('Verplicht en inbegrepen').length).toBeGreaterThan(0);
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
  expect(screen.getAllByRole('table')).toHaveLength(3);
  expect(global.fetch).not.toHaveBeenCalled();
});

it('reports invalid shared configurations instead of silently changing prices', async () => {
  render(await SkateboardPage({ searchParams: Promise.resolve({ deck: 'missing' }) }));
  expect(screen.getByRole('heading', { name: 'Ongeldige configuratie' })).toBeInTheDocument();
});

it('restores delivery choices from a shared URL', async () => {
  render(await SkateboardPage({ searchParams: Promise.resolve({ view: 'agent', country: 'BE', shipping: 'express', transportInsurance: 'true' }) }));
  expect(screen.getByText(/Bestemming: Belgie. Verzendmethode: express/)).toBeInTheDocument();
  expect(screen.getByText(normalizedMoney(16194))).toBeInTheDocument();
  expect(global.fetch).not.toHaveBeenCalled();
});