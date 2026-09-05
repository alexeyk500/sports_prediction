import type { NextRequest } from "next/server";

export async function readJsonBody(request: NextRequest, maxBytes = 16 * 1024): Promise<unknown> {
  const text = await request.text();

  if (text.length > maxBytes) {
    throw new SyntaxError("Request body is too large.");
  }

  if (!text) {
    return {};
  }

  return JSON.parse(text);
}
