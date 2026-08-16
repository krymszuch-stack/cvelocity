/**
 * IP address classification for SSRF defence.
 *
 * The rule is allow-by-exclusion: an address is usable only if it falls into no
 * blocked range. Anything unparseable is treated as blocked, so a parsing gap can
 * never open a hole.
 */

/** IPv4 ranges that must never be reachable from a user-supplied URL. */
const BLOCKED_IPV4: ReadonlyArray<readonly [string, number]> = [
  ['0.0.0.0', 8], // "this network"
  ['10.0.0.0', 8], // RFC1918 private
  ['100.64.0.0', 10], // RFC6598 carrier-grade NAT
  ['127.0.0.0', 8], // loopback
  ['169.254.0.0', 16], // link-local — includes cloud metadata at 169.254.169.254
  ['172.16.0.0', 12], // RFC1918 private
  ['192.0.0.0', 24], // IETF protocol assignments
  ['192.0.2.0', 24], // TEST-NET-1
  ['192.168.0.0', 16], // RFC1918 private
  ['198.18.0.0', 15], // benchmarking
  ['198.51.100.0', 24], // TEST-NET-2
  ['203.0.113.0', 24], // TEST-NET-3
  ['224.0.0.0', 4], // multicast
  ['240.0.0.0', 4], // reserved, includes 255.255.255.255
];

function ipv4ToInt(ip: string): number | null {
  const parts = ip.split('.');
  if (parts.length !== 4) return null;

  let value = 0;
  for (const part of parts) {
    // Reject empty, non-numeric, out-of-range and zero-padded octets. Padding
    // matters: some resolvers read a leading zero as octal, so "0177.0.0.1"
    // would reach 127.0.0.1 while looking like a public address.
    if (!/^\d{1,3}$/.test(part)) return null;
    if (part.length > 1 && part[0] === '0') return null;
    const octet = Number(part);
    if (octet > 255) return null;
    value = value * 256 + octet;
  }
  return value;
}

function isBlockedIpv4(ip: string): boolean {
  const value = ipv4ToInt(ip);
  if (value === null) return true; // unparseable → refuse

  return BLOCKED_IPV4.some(([base, bits]) => {
    const baseValue = ipv4ToInt(base);
    if (baseValue === null) return true;
    const mask = bits === 0 ? 0 : (-1 << (32 - bits)) >>> 0;
    return (value & mask) >>> 0 === (baseValue & mask) >>> 0;
  });
}

/** Expands an IPv6 address to its eight 16-bit groups. */
function expandIpv6(ip: string): number[] | null {
  const zoneless = ip.split('%')[0].toLowerCase();
  const halves = zoneless.split('::');
  if (halves.length > 2) return null;

  const parseGroups = (segment: string): number[] | null => {
    if (segment === '') return [];
    const out: number[] = [];
    for (const group of segment.split(':')) {
      if (!/^[0-9a-f]{1,4}$/.test(group)) return null;
      out.push(parseInt(group, 16));
    }
    return out;
  };

  const head = parseGroups(halves[0]);
  const tail = halves.length === 2 ? parseGroups(halves[1]) : [];
  if (head === null || tail === null) return null;

  if (halves.length === 2) {
    const fill = 8 - head.length - tail.length;
    if (fill < 0) return null;
    return [...head, ...Array(fill).fill(0), ...tail];
  }
  return head.length === 8 ? head : null;
}

/**
 * Extracts the embedded IPv4 address from IPv4-mapped (::ffff:0:0/96) and
 * NAT64 (64:ff9b::/96) addresses, which otherwise smuggle a private IPv4
 * target past an IPv6-only check.
 */
function embeddedIpv4(groups: number[]): string | null {
  const isMapped = groups.slice(0, 5).every((g) => g === 0) && groups[5] === 0xffff;
  const isNat64 =
    groups[0] === 0x0064 &&
    groups[1] === 0xff9b &&
    groups.slice(2, 6).every((g) => g === 0);

  if (!isMapped && !isNat64) return null;
  const [a, b] = [groups[6], groups[7]];
  return `${a >> 8}.${a & 0xff}.${b >> 8}.${b & 0xff}`;
}

function isBlockedIpv6(ip: string): boolean {
  const groups = expandIpv6(ip);
  if (groups === null) return true; // unparseable → refuse

  const mapped = embeddedIpv4(groups);
  if (mapped !== null) return isBlockedIpv4(mapped);

  if (groups.every((g) => g === 0)) return true; // ::
  if (groups.slice(0, 7).every((g) => g === 0) && groups[7] === 1) return true; // ::1
  if ((groups[0] & 0xfe00) === 0xfc00) return true; // fc00::/7 unique local
  if ((groups[0] & 0xffc0) === 0xfe80) return true; // fe80::/10 link-local
  if ((groups[0] & 0xff00) === 0xff00) return true; // ff00::/8 multicast
  if (groups[0] === 0x2001 && groups[1] === 0x0db8) return true; // 2001:db8::/32 docs

  return false;
}

/** True when the address must not be contacted on behalf of a user-supplied URL. */
export function isBlockedAddress(ip: string, family?: number): boolean {
  if (!ip) return true;
  if (family === 4) return isBlockedIpv4(ip);
  if (family === 6) return isBlockedIpv6(ip);
  return ip.includes(':') ? isBlockedIpv6(ip) : isBlockedIpv4(ip);
}

/** Hostnames that resolve inside infrastructure and never belong to a job posting. */
const BLOCKED_HOST_SUFFIXES = [
  '.local',
  '.internal',
  '.localhost',
  '.home.arpa',
  '.cluster.local',
];

const BLOCKED_HOSTNAMES = new Set([
  'localhost',
  'metadata.google.internal',
  'metadata',
  'instance-data',
]);

export function isBlockedHostname(hostname: string): boolean {
  const host = hostname.toLowerCase().replace(/\.$/, '');
  if (!host) return true;
  if (BLOCKED_HOSTNAMES.has(host)) return true;
  if (BLOCKED_HOST_SUFFIXES.some((suffix) => host.endsWith(suffix))) return true;
  // A single-label host can only be internal; public names always carry a dot.
  if (!host.includes('.') && !host.includes(':')) return true;
  return false;
}
