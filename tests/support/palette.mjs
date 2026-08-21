// The declared palette and faces, read out of the real stylesheet.
//
// jsdom does not resolve `var()` — `getComputedStyle` hands back the literal
// string "var(--ink)" — so the tokens are parsed from src/styles.css here and
// substituted. That means a rule about what a colour actually *is* can still be
// checked against the file the browser gets, rather than against a copy of the
// palette kept in a test and free to drift.

import { readFileSync } from 'node:fs';

const CSS = readFileSync('src/styles.css', 'utf8');
const ROOT = Object.fromEntries(
  [...(CSS.match(/:root\s*\{([\s\S]*?)\n\}/)?.[1] ?? '').matchAll(/--([\w-]+):\s*([^;]+);/g)].map(
    ([, name, value]) => [name, value.trim().replace(/\s+/g, ' ')],
  ),
);

/** One declared token, whitespace collapsed. */
export const token = (name) => ROOT[name];

/** A declared value with every `var(--x)` in it substituted. */
export const resolve = (value) =>
  value.replace(/var\(--([\w-]+)\)/g, (_, name) => ROOT[name]).replace(/\s+/g, ' ').trim();

/**
 * The declarations of the first rule written for `selector`, verbatim.
 *
 * For the handful of things jsdom cannot compute at all: a pseudo-element's
 * style. Asking the stylesheet which token a pseudo draws from is not the same
 * as asking the browser what it painted — but it is the difference between the
 * ribbon and the stitching being able to drift apart and not, which is what the
 * rule is about. Selectors are matched at the start of a line, which is how
 * every rule in the file is written.
 */
export function ruleFor(selector) {
  const escaped = selector.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return CSS.match(new RegExp(`^${escaped}\\s*\\{([^}]*)\\}`, 'm'))?.[1] ?? '';
}

/** The three channels of `#rrggbb` or of an `rgb(...)` — jsdom hands back both. */
const channels = (colour) => {
  const value = colour.trim();
  const rgb = value.match(/^rgba?\(([^)]+)\)$/);
  if (rgb) return rgb[1].split(',').slice(0, 3).map((part) => Number(part.trim()));
  const hex = value.replace('#', '');
  return [0, 2, 4].map((at) => parseInt(hex.slice(at, at + 2), 16));
};

/** WCAG relative luminance. */
export function lightness(hex) {
  const [r, g, b] = channels(hex).map((v) => {
    const c = v / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

/** WCAG contrast ratio, 1 to 21. */
export function contrast(a, b) {
  const [light, dark] = [lightness(a), lightness(b)].sort((x, y) => y - x);
  return (light + 0.05) / (dark + 0.05);
}

/**
 * How warm a colour is: red channel minus blue. Paper is warm, a system grey is
 * not, and this is the difference between the two in one number.
 */
export function warmth(hex) {
  const [r, , b] = channels(hex);
  return r - b;
}
