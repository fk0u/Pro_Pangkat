export async function GET() {
  if (process.env.NODE_ENV === 'production') {
    return new Response(JSON.stringify({ error: 'Not Found' }), { status: 404 });
  }
  return new Response("Debug Route Placeholder", { status: 200 });
}
