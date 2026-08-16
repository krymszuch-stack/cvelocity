import { describe, it, expect } from 'vitest';
import { isBlockedAddress, isBlockedHostname } from '../ipGuard';

describe('ipGuard — ochrona przed SSRF', () => {
  describe('adresy, które muszą zostać zablokowane', () => {
    const blocked: Array<[string, string]> = [
      ['127.0.0.1', 'loopback'],
      ['127.1.2.3', 'loopback (cały /8)'],
      ['10.0.0.1', 'sieć prywatna RFC1918'],
      ['172.16.0.1', 'sieć prywatna RFC1918'],
      ['172.31.255.254', 'górna granica 172.16/12'],
      ['192.168.1.1', 'sieć prywatna RFC1918'],
      ['169.254.169.254', 'metadane chmury AWS/GCP'],
      ['169.254.0.1', 'link-local'],
      ['100.64.0.1', 'CGNAT'],
      ['0.0.0.0', '"this network"'],
      ['224.0.0.1', 'multicast'],
      ['255.255.255.255', 'broadcast'],
      ['::1', 'loopback IPv6'],
      ['::', 'nieokreślony IPv6'],
      ['fc00::1', 'unique local IPv6'],
      ['fe80::1', 'link-local IPv6'],
      ['::ffff:127.0.0.1', 'IPv4-mapped loopback'],
      ['::ffff:169.254.169.254', 'IPv4-mapped metadane chmury'],
      ['64:ff9b::a00:1', 'NAT64 na 10.0.0.1'],
    ];

    it.each(blocked)('blokuje %s (%s)', (ip) => {
      expect(isBlockedAddress(ip)).toBe(true);
    });

    it('blokuje oktety z zerem wiodącym — 0177.0.0.1 czytane ósemkowo to 127.0.0.1', () => {
      expect(isBlockedAddress('0177.0.0.1')).toBe(true);
    });

    it('blokuje wszystko, czego nie potrafi sparsować', () => {
      expect(isBlockedAddress('nie-adres')).toBe(true);
      expect(isBlockedAddress('')).toBe(true);
      expect(isBlockedAddress('999.1.1.1')).toBe(true);
      expect(isBlockedAddress('1.2.3')).toBe(true);
    });
  });

  describe('adresy publiczne, które muszą przejść', () => {
    const allowed = ['8.8.8.8', '1.1.1.1', '104.16.0.1', '172.15.0.1', '172.32.0.1', '2606:4700::1'];

    it.each(allowed)('przepuszcza %s', (ip) => {
      expect(isBlockedAddress(ip)).toBe(false);
    });

    it('172.15 i 172.32 są publiczne — blok dotyczy tylko 172.16/12', () => {
      expect(isBlockedAddress('172.15.255.255')).toBe(false);
      expect(isBlockedAddress('172.32.0.0')).toBe(false);
    });
  });

  describe('nazwy hostów', () => {
    it.each([
      'localhost',
      'metadata.google.internal',
      'redis',
      'api.internal',
      'db.cluster.local',
      'router.home.arpa',
    ])('blokuje %s', (host) => {
      expect(isBlockedHostname(host)).toBe(true);
    });

    it.each(['justjoin.it', 'nofluffjobs.com', 'www.pracuj.pl'])('przepuszcza %s', (host) => {
      expect(isBlockedHostname(host)).toBe(false);
    });

    it('ignoruje wielkość liter i kropkę na końcu', () => {
      expect(isBlockedHostname('LOCALHOST')).toBe(true);
      expect(isBlockedHostname('localhost.')).toBe(true);
    });
  });
});
