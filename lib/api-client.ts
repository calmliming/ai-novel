"use client";

import { ensureErrorMessage } from "@/lib/utils";

export async function apiFetch<T>(url: string, options?: RequestInit): Promise<T> {
  const response = await fetch(url, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(options?.headers ?? {})
    }
  });

  const contentType = response.headers.get("content-type");
  const body = contentType?.includes("application/json")
    ? await response.json()
    : await response.text();

  if (!response.ok) {
    const message =
      typeof body === "object" && body && "error" in body
        ? String((body as { error: unknown }).error)
        : ensureErrorMessage(body);
    const error = new Error(message);
    Object.assign(error, { status: response.status, body });
    throw error;
  }

  return body as T;
}

export function getApiError(error: unknown) {
  return ensureErrorMessage(error);
}

