/**
 * Shared color helpers for theme-driven UI composition.
 *
 * Keeps opacity usage consistent and avoids raw rgba/hex literals scattered
 * across feature components.
 */

const clamp = (value: number, min: number, max: number): number =>
  Math.min(max, Math.max(min, value));

const normalizeHex = (value: string): string => {
  const normalized = value.trim().replace(/^#/, '');

  if (normalized.length === 3 || normalized.length === 4) {
    return normalized
      .split('')
      .map((char) => `${char}${char}`)
      .join('');
  }

  return normalized;
};

const parseHexToRgb = (value: string): { r: number; g: number; b: number } | null => {
  const normalized = normalizeHex(value);

  if (normalized.length !== 6 && normalized.length !== 8) {
    return null;
  }

  const base = normalized.slice(0, 6);
  const numeric = Number.parseInt(base, 16);

  if (!Number.isFinite(numeric)) {
    return null;
  }

  return {
    r: (numeric >> 16) & 255,
    g: (numeric >> 8) & 255,
    b: numeric & 255,
  };
};

const parseRgbChannels = (value: string): { r: number; g: number; b: number } | null => {
  const match = value
    .trim()
    .match(
      /^rgba?\(\s*(\d+(?:\.\d+)?)\s*,\s*(\d+(?:\.\d+)?)\s*,\s*(\d+(?:\.\d+)?)(?:\s*,\s*[\d.]+)?\s*\)$/i,
    );

  if (!match) {
    return null;
  }

  const r = Number.parseFloat(match[1]);
  const g = Number.parseFloat(match[2]);
  const b = Number.parseFloat(match[3]);

  if (![r, g, b].every((channel) => Number.isFinite(channel))) {
    return null;
  }

  return {
    r: clamp(Math.round(r), 0, 255),
    g: clamp(Math.round(g), 0, 255),
    b: clamp(Math.round(b), 0, 255),
  };
};

export const withAlpha = (color: string, opacity: number): string => {
  const safeOpacity = clamp(opacity, 0, 1);

  const fromHex = parseHexToRgb(color);
  if (fromHex) {
    return `rgba(${fromHex.r}, ${fromHex.g}, ${fromHex.b}, ${safeOpacity})`;
  }

  const fromRgb = parseRgbChannels(color);
  if (fromRgb) {
    return `rgba(${fromRgb.r}, ${fromRgb.g}, ${fromRgb.b}, ${safeOpacity})`;
  }

  // Fall back to original color if format is unsupported.
  return color;
};
