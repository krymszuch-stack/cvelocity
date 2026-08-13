import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  normaliseHost,
  isBlockedHost,
  validateOutboundUrl,
  safeOutboundFetch,
  OutboundValidationError
} from '../outboundValidation';

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
    // additional expanded private/internal subnets and representations
    'http://[::ffff:10.0.0.1]/',
    'http://[::ffff:192.168.1.1]/',
    'http://[::ffff:c0a8:0101]/',
    'http://167772161/', // 10.0.0.1 in decimal
    'http://0xc0a80101/', // 192.168.1.1 in hex
    'http://012.0.0.1/', // 10.0.0.1 in octal
    'http://0300.0250.0001.0001/', // 192.168.1.1 in octal
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

describe('safeOutboundFetch security validation', () => {
  let originalFetch: typeof global.fetch;

  beforeEach(() => {
    originalFetch = global.fetch;
  });

  afterEach(() => {
    global.fetch = originalFetch;
    vi.restoreAllMocks();
  });

  it('should allow fetching a normal public URL', async () => {
    const mockResponse = new Response('ok', { status: 200 });
    global.fetch = vi.fn().mockResolvedValue(mockResponse);

    const res = await safeOutboundFetch('https://example.com/job-offer');
    expect(res.status).toBe(200);
    expect(global.fetch).toHaveBeenCalledTimes(1);
    expect(global.fetch).toHaveBeenCalledWith('https://example.com/job-offer', { redirect: 'manual' });
  });

  it('should block immediate private IP requests', async () => {
    global.fetch = vi.fn();

    await expect(safeOutboundFetch('http://127.0.0.1/')).rejects.toThrow(
      OutboundValidationError
    );
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it('should follow safe public redirects', async () => {
    const redirectResponse = {
      status: 301,
      headers: new Headers({ location: 'https://example.com/target' }),
    } as Response;
    const finalResponse = {
      status: 200,
      headers: new Headers(),
    } as Response;

    global.fetch = vi.fn()
      .mockResolvedValueOnce(redirectResponse)
      .mockResolvedValueOnce(finalResponse);

    const res = await safeOutboundFetch('https://example.com/source');
    expect(res.status).toBe(200);
    expect(global.fetch).toHaveBeenCalledTimes(2);
    expect(global.fetch).toHaveBeenNthCalledWith(1, 'https://example.com/source', { redirect: 'manual' });
    expect(global.fetch).toHaveBeenNthCalledWith(2, 'https://example.com/target', { redirect: 'manual' });
  });

  it('should block a redirect to a private IP (SSRF protection)', async () => {
    const redirectResponse = {
      status: 302,
      headers: new Headers({ location: 'http://169.254.169.254/latest/meta-data/' }),
    } as Response;

    global.fetch = vi.fn().mockResolvedValue(redirectResponse);

    await expect(safeOutboundFetch('https://example.com/redirect-to-metadata')).rejects.toThrow(
      'Adresy lokalne i prywatne są niedozwolone.'
    );
    expect(global.fetch).toHaveBeenCalledTimes(1);
  });

  it('should throw error on redirect loops / too many hops', async () => {
    const redirectResponse = {
      status: 302,
      headers: new Headers({ location: 'https://example.com/loop' }),
    } as Response;

    global.fetch = vi.fn().mockResolvedValue(redirectResponse);

    await expect(safeOutboundFetch('https://example.com/loop', {}, 3)).rejects.toThrow(
      'Zbyt wiele przekierowań przy pobieraniu oferty.'
    );
    expect(global.fetch).toHaveBeenCalledTimes(4); // original + 3 hops
  });
});
