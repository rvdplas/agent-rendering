import { calculateQuote } from 'lib/skateboard/catalog';

export async function POST(request: Request) {
  if (!request.headers.get('content-type')?.toLowerCase().startsWith('application/json')) {
    return Response.json({ error: 'Gebruik application/json.' }, { status: 415 });
  }
  let input: unknown;
  try {
    input = await request.json();
  } catch {
    return Response.json({ error: 'Ongeldige JSON.' }, { status: 400 });
  }
  try {
    return Response.json(calculateQuote(input), { headers: { 'Cache-Control': 'no-store' } });
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : 'Ongeldige configuratie.' }, { status: 400 });
  }
}