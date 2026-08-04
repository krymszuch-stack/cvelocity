import { describe, it, expect } from 'vitest';

/**
 * Regression guard for the SSRF filter in server.ts.
 *
 * The logic is duplicated here rather than imported because server.ts starts an
 * Express listener on import. It must stay in sync with `validateOutboundHost`.
 *
 * Background: the first version matched hostnames as text, so `[::ffff:127.0.0.1]`
 * walked straight through — `new URL()` rewrites that into the hex form
 * `::ffff:7f00:1`, which the dotted-quad pattern never saw.
 */
function normaliseHost(rawHost: string): string {
  let host = rawHost.toLowerCase().replace(/^\[|\]$/g, '');

  const mappedHex = host.match(/^::ffff:([0-9a-f]{1,4}):([0-9a-f]{1,4})$/);
  if (mappedHex) {
    const high = parseInt(mappedHex[1], 16);
    const low = parseInt(mappedHex[2], 16);
    host = [(high >> 8) & 255, high & 255, (low >> 8) & 255, low & 255].join('.');
  }
  const mappedDotted = host.match(/^::(?:ffff:)?(\d{1,3}(?:\.\d{1,3}){3})$/);
  if (mappedDotted) host = mappedDotted[1];

  const asInt = /^\d+$/.test(host) ? Number(host) : /^0x[0-9a-f]+$/.test(host) ? parseInt(host, 16) : NaN;
  if (Number.isFinite(asInt) && asInt >= 0 && asInt <= 0xffffffff) {
    host = [(asInt >>> 24) & 255, (asInt >>> 16) & 255, (asInt >>> 8) & 255, asInt & 255].join('.');
  }
  if (/^0\d+(?:\.0*\d+){3}$/.test(host)) {
    host = host.split('.').map((p) => String(parseInt(p, 8))).join('.');
  }
  return host;
}

function isBlockedHost(rawHost: string): boolean {
  const host = normaliseHost(rawHost);
  return (
    host === 'localhost' ||
    host.endsWith('.localhost') ||
    host === '::1' ||
    host === '::' ||
    host === '0.0.0.0' ||
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

/** Mirrors how the server sees a host: after WHATWG URL normalisation. */
const hostOf = (url: string) => new URL(url).hostname;

describe('SSRF host validation', () => {
  const blocked = [
    'http://localhost/',
    'http://127.0.0.1/',
    'http://127.1.2.3/',
    'http://[::1]/',
    'http://10.0.0.5/',
    'http://192.168.1.1/',
    'http://172.16.0.1/',
    'http://169.254.169.254/',
    'http://100.64.0.1/',
    'http://0.0.0.0/',
    // alternative spellings of 127.0.0.1
    'http://2130706433/',
    'http://0x7f000001/',
    // IPv4-mapped IPv6 — the bypass that reached a real local file
    'http://[::ffff:127.0.0.1]/',
    'http://[0:0:0:0:0:ffff:127.0.0.1]/',
    'http://[::ffff:169.254.169.254]/',
  ];

  it.each(blocked)('blokuje %s', (url) => {
    expect(isBlockedHost(hostOf(url))).toBe(true);
  });

  const allowed = [
    'https://example.com/',
    'https://www.pracuj.pl/praca/developer,oferta,123',
    'https://nofluffjobs.com/pl/job/abc',
    'https://8.8.8.8/',
    'https://172.32.0.1/',
    'https://100.128.0.1/',
  ];

  it.each(allowed)('przepuszcza %s', (url) => {
    expect(isBlockedHost(hostOf(url))).toBe(false);
  });

  it('normalizuje IPv4-mapped IPv6 do postaci IPv4', () => {
    expect(normaliseHost(hostOf('http://[::ffff:127.0.0.1]/'))).toBe('127.0.0.1');
    expect(normaliseHost(hostOf('http://[::ffff:169.254.169.254]/'))).toBe('169.254.169.254');
  });
});
