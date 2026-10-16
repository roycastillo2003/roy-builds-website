export function json(data, status = 200) {
  return Response.json(data, { status, headers: { "Cache-Control": "no-store", "X-Content-Type-Options": "nosniff" } });
}
export function safeMessage(error) {
  console.error(error);
  return error?.status === 429 ? "A service rate limit was reached. Please try again." : "The scan could not be completed.";
}
