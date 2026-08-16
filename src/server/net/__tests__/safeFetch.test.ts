import { describe, it, expect } from 'vitest';
import { safeFetchHtml, SafeFetchError } from '../safeFetch';

/**
 * These assert that a malicious URL is rejected *before* any connection is made.
 * They run offline: every case below fails validation, so nothing leaves the machine.
 */
describe('safeFetchHtml — odrzucanie złośliwych adresów', () => {
  async function expectRejected(url: string, code?: SafeFetchError['code']) {
    await expect(safeFetchHtml(url)).rejects.toThrow(SafeFetchError);
    try {
      await safeFetchHtml(url);
    } catch (err) {
      expect(err).toBeInstanceOf(SafeFetchError);
      if (code) expect((err as SafeFetchError).code).toBe(code);
    }
  }

  describe('zasoby wewnętrzne i metadane chmury', () => {
    it.each([
      ['http://127.0.0.1/', 'loopback'],
      ['http://127.0.0.1:22/', 'loopback, port SSH'],
      ['http://localhost/', 'localhost po nazwie'],
      ['http://[::1]/', 'loopback IPv6'],
      ['http://169.254.169.254/latest/meta-data/', 'metadane AWS'],
      ['http://metadata.google.internal/computeMetadata/v1/', 'metadane GCP'],
      ['http://10.0.0.1/', 'sieć prywatna'],
      ['http://192.168.1.1/', 'router domowy'],
      ['http://172.16.0.1/', 'sieć prywatna'],
      ['http://100.64.0.1/', 'CGNAT'],
      ['http://redis:6379/', 'usługa po nazwie w sieci kontenerów'],
      ['http://0177.0.0.1/', 'zapis ósemkowy loopbacku'],
      ['http://[::ffff:127.0.0.1]/', 'IPv4-mapped loopback'],
    ])('odrzuca %s (%s)', async (url) => {
      await expectRejected(url, 'BLOCKED_TARGET');
    });
  });

  describe('nieprawidłowe adresy', () => {
    it('odrzuca protokoły inne niż http/https', async () => {
      await expectRejected('file:///etc/passwd', 'INVALID_URL');
      await expectRejected('gopher://example.com/', 'INVALID_URL');
      await expectRejected('ftp://example.com/', 'INVALID_URL');
    });

    it('odrzuca dane logowania w URL — służą do mylenia parserów co do hosta', async () => {
      await expectRejected('http://user:pass@example.com/', 'INVALID_URL');
    });

    it('odrzuca porty inne niż 80 i 443', async () => {
      await expectRejected('http://example.com:8080/', 'BLOCKED_TARGET');
      await expectRejected('http://example.com:6379/', 'BLOCKED_TARGET');
    });

    it('odrzuca tekst niebędący adresem', async () => {
      await expectRejected('to nie jest url', 'INVALID_URL');
      await expectRejected('', 'INVALID_URL');
    });
  });
});
