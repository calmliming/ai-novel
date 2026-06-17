import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { ensureErrorMessage } from "@/lib/utils";

export function json(data: unknown, init?: ResponseInit) {
  return NextResponse.json(data, init);
}

export function notFound(message = "Not found") {
  return json({ error: message }, { status: 404 });
}

export function badRequest(message: string, details?: unknown) {
  return json({ error: message, details }, { status: 400 });
}

export function conflict(data: unknown) {
  return json(data, { status: 409 });
}

export function handleRouteError(error: unknown) {
  if (error instanceof ZodError) {
    return badRequest("Invalid request payload.", error.flatten());
  }

  return json({ error: ensureErrorMessage(error) }, { status: 500 });
}

