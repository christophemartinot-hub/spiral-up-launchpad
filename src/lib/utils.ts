import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function stripMarkdownEdgeArtifacts(text: string) {
  return text
    .replace(/^\s*\*\*\s*/, "")
    .replace(/\s*\*\*\s*$/, "")
    .trim();
}

export function sanitizePlainTextPayload<T>(value: T): T {
  if (typeof value === "string") {
    return stripMarkdownEdgeArtifacts(value) as T;
  }

  if (Array.isArray(value)) {
    return value.map((item) => sanitizePlainTextPayload(item)) as T;
  }

  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>).map(([key, nestedValue]) => [
        key,
        sanitizePlainTextPayload(nestedValue),
      ])
    ) as T;
  }

  return value;
}
