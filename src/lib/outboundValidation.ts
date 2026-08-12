export class OutboundValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "OutboundValidationError";
  }
}

/**
 * Normalises a host representation down to its canonical IP or hostname representation.
 * Handles decimal, hex, octal, and IPv4-mapped IPv6 formats.
 */
export function normaliseHost(rawHost: string): string {
  let host = rawHost.toLowerCase().replace(/^\[|\]$/g, "");

  // IPv4-mapped IPv6 -> bare IPv4. Note that `new URL()` rewrites the readable
  // form `::ffff:127.0.0.1` into hex (`::ffff:7f00:1`), so matching the dotted
  // spelling alone silently misses every real request.
  const mappedHex = host.match(/^::ffff:([0-9a-f]{1,4}):([0-9a-f]{1,4})$/);
  if (mappedHex) {
    const high = parseInt(mappedHex[1], 16);
    const low = parseInt(mappedHex[2], 16);
    host = [(high >> 8) & 255, high & 255, (low >> 8) & 255, low & 255].join(".");
  }
  const mappedDotted = host.match(/^::(?:ffff:)?(\d{1,3}(?:\.\d{1,3}){3})$/);
  if (mappedDotted) host = mappedDotted[1];

  // Decimal / octal / hex spellings of an IPv4 address (e.g. 2130706433, 0177.0.0.1)
  const asInt = /^\d+$/.test(host) ? Number(host) : /^0x[0-9a-f]+$/.test(host) ? parseInt(host, 16) : NaN;
  if (Number.isFinite(asInt) && asInt >= 0 && asInt <= 0xffffffff) {
    host = [(asInt >>> 24) & 255, (asInt >>> 16) & 255, (asInt >>> 8) & 255, asInt & 255].join(".");
  }
  if (/^0\d+(?:\.0*\d+){3}$/.test(host)) {
    host = host.split(".").map((p) => String(parseInt(p, 8))).join(".");
  }
  return host;
}

/**
 * Checks if the normalised host resolves to loopback, link-local, or private RFC 1918 subnets.
 */
export function isBlockedHost(rawHost: string): boolean {
  const host = normaliseHost(rawHost);
  return (
    host === "localhost" ||
    host.endsWith(".localhost") ||
    host === "::1" ||
    host === "::" ||
    host === "0.0.0.0" ||
    /^0\./.test(host) ||
    /^127\./.test(host) ||
    /^10\./.test(host) ||
    /^192\.168\./.test(host) ||
    /^172\.(1[6-9]|2\d|3[01])\./.test(host) ||
    /^169\.254\./.test(host) ||
    /^100\.(6[4-9]|[7-9]\d|1[01]\d|12[0-7])\./.test(host) ||
    /^f[cd][0-9a-f]{2}:/.test(host) ||
    /^fe80:/.test(host)
  );
}

/**
 * Returns an error string if host is blocked, or null if it's acceptable.
 */
export function validateOutboundHost(rawHost: string): string | null {
  if (isBlockedHost(rawHost)) {
    return "Adresy lokalne i prywatne są niedozwolone.";
  }
  return null;
}

/**
 * Validates the full URL including protocol and hostname.
 */
export function validateOutboundUrl(raw: string): string | null {
  let parsed: URL;
  try {
    parsed = new URL(raw);
  } catch {
    return "Podaj prawidłowy adres URL ogłoszenia o pracę (http/https).";
  }

  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
    return "Dozwolone są wyłącznie adresy http i https.";
  }

  return validateOutboundHost(parsed.hostname);
}

/**
 * fetch() that refuses to be redirected somewhere the caller was not allowed to
 * ask for directly. Validating only the submitted URL is not enough — a permitted
 * public host can answer with `Location: http://127.0.0.1/`.
 */
export async function safeOutboundFetch(url: string, init: RequestInit = {}, maxHops = 3): Promise<Response> {
  let current = url;

  for (let hop = 0; hop <= maxHops; hop++) {
    const invalid = validateOutboundUrl(current);
    if (invalid) throw new OutboundValidationError(invalid);

    const response = await fetch(current, { ...init, redirect: "manual" });

    if (response.status < 300 || response.status > 399) return response;

    const location = response.headers.get("location");
    if (!location) return response;

    current = new URL(location, current).toString();
  }

  throw new OutboundValidationError("Zbyt wiele przekierowań przy pobieraniu oferty.");
}
