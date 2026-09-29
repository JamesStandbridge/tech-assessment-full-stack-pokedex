import type { TermTone } from "../domain/terms";

export function toneColor(tone: TermTone): string {
  return `var(--color-tone-${tone})`;
}

export function typeColor(type: string): string {
  return `var(--color-type-${type}, var(--color-muted))`;
}
