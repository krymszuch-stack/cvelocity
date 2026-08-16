import http from 'node:http';
import https from 'node:https';
import dns from 'node:dns/promises';
import { isBlockedAddress, isBlockedHostname } from './ipGuard';

export class SafeFetchError extends Error {
  constructor(
    message: string,
    readonly code:
      | 'INVALID_URL'
      | 'BLOCKED_TARGET'
      | 'TOO_MANY_REDIRECTS'
      | 'TIMEOUT'
      | 'TOO_LARGE'
      | 'BAD_CONTENT_TYPE'
      | 'UPSTREAM_ERROR'
      | 'BOT_PROTECTED',
    readonly status?: number
  ) {
    super(message);
    this.name = 'SafeFetchError';
  }
}

const MAX_REDIRECTS = 3;
const TIMEOUT_MS = 8_000;
const MAX_BYTES = 2 * 1024 * 1024; // 2 MB
const ALLOWED_PORTS = new Set(['', '80', '443']);

const ALLOWED_CONTENT_TYPES = [
  'text/html',
  'application/xhtml+xml',
  'text/plain',
  'application/ld+json',
];

export interface SafeFetchResult {
  html: string;
  finalUrl: string;
  charset: string;
}

/**
 * Validates the shape of a user-supplied URL before any DNS or network activity.
 */
function parseAndValidateUrl(rawUrl: string): URL {
  let url: URL;
  try {
    url = new URL(rawUrl);
  } catch {
    throw new SafeFetchError('Nieprawidłowy adres URL.', 'INVALID_URL');
  }

  if (url.protocol !== 'http:' && url.protocol !== 'https:') {
    throw new SafeFetchError('Dozwolone są wyłącznie adresy http i https.', 'INVALID_URL');
  }

  // Credentials in a URL are a classic way to confuse parsers about the real host.
  if (url.username || url.password) {
    throw new SafeFetchError('Adres URL nie może zawierać danych logowania.', 'INVALID_URL');
  }

  if (!ALLOWED_PORTS.has(url.port)) {
    throw new SafeFetchError('Dozwolone są wyłącznie porty 80 i 443.', 'BLOCKED_TARGET');
  }

  if (isBlockedHostname(url.hostname)) {
    throw new SafeFetchError('Ten adres wskazuje na zasób wewnętrzny.', 'BLOCKED_TARGET');
  }

  return url;
}

/**
 * Resolves a hostname and returns only addresses that passed the block-list.
 * Every A/AAAA record must pass — a single private address disqualifies the host,
 * otherwise a round-robin record could alternate between public and private.
 */
async function resolveAllowedAddresses(
  hostname: string
): Promise<Array<{ address: string; family: number }>> {
  // A literal IP in the URL never reaches DNS, so validate it directly.
  const literal = hostname.replace(/^\[|\]$/g, '');
  if (/^[\d.]+$/.test(literal) || literal.includes(':')) {
    if (isBlockedAddress(literal)) {
      throw new SafeFetchError('Ten adres wskazuje na zasób wewnętrzny.', 'BLOCKED_TARGET');
    }
    return [{ address: literal, family: literal.includes(':') ? 6 : 4 }];
  }

  let records: Array<{ address: string; family: number }>;
  try {
    records = await dns.lookup(hostname, { all: true });
  } catch {
    throw new SafeFetchError('Nie udało się rozwiązać adresu domeny.', 'UPSTREAM_ERROR');
  }

  if (records.length === 0) {
    throw new SafeFetchError('Domena nie ma żadnego adresu IP.', 'UPSTREAM_ERROR');
  }

  for (const record of records) {
    if (isBlockedAddress(record.address, record.family)) {
      throw new SafeFetchError('Ten adres wskazuje na zasób wewnętrzny.', 'BLOCKED_TARGET');
    }
  }

  return records;
}

/** Recognises a bot-protection challenge so we can stop instead of working around it. */
function detectBotProtection(status: number, headers: http.IncomingHttpHeaders): boolean {
  if (status !== 403 && status !== 503) return false;
  const server = String(headers['server'] ?? '').toLowerCase();
  return (
    server.includes('cloudflare') ||
    headers['cf-mitigated'] !== undefined ||
    headers['x-datadome'] !== undefined ||
    String(headers['set-cookie'] ?? '').includes('__cf')
  );
}

function charsetFromContentType(contentType: string): string | null {
  const match = /charset=["']?([\w-]+)/i.exec(contentType);
  return match ? match[1].toLowerCase() : null;
}

/** Reads `<meta charset>` from the head, for pages that omit it in the header. */
function charsetFromMeta(head: Buffer): string | null {
  const text = head.subarray(0, 2048).toString('latin1');
  const direct = /<meta[^>]+charset=["']?([\w-]+)/i.exec(text);
  if (direct) return direct[1].toLowerCase();
  const httpEquiv = /<meta[^>]+content=["'][^"']*charset=([\w-]+)/i.exec(text);
  return httpEquiv ? httpEquiv[1].toLowerCase() : null;
}

interface SingleRequestResult {
  redirectTo?: string;
  body?: Buffer;
  contentType: string;
}

/**
 * Performs one request with the resolved IP pinned, so the address validated above
 * is the address actually connected to. Without pinning, DNS is resolved a second
 * time inside the agent and can return a different (private) answer — DNS rebinding.
 */
function requestOnce(
  url: URL,
  pinned: { address: string; family: number }
): Promise<SingleRequestResult> {
  return new Promise((resolve, reject) => {
    const transport = url.protocol === 'https:' ? https : http;

    const req = transport.request(
      {
        protocol: url.protocol,
        hostname: url.hostname,
        port: url.port || (url.protocol === 'https:' ? 443 : 80),
        path: `${url.pathname}${url.search}`,
        method: 'GET',
        // Pin the connection to the address we validated. The Host header and SNI
        // still carry the original hostname, so virtual hosting and TLS still work.
        // Node calls this with `{all: true}` and then expects an array, but the
        // single-address form is still used elsewhere — handle both shapes.
        lookup: ((hostname: string, options: { all?: boolean }, callback: Function) => {
          if (options?.all) {
            callback(null, [{ address: pinned.address, family: pinned.family }]);
          } else {
            callback(null, pinned.address, pinned.family);
          }
        }) as never,
        headers: {
          'User-Agent':
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
          Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
          'Accept-Language': 'pl-PL,pl;q=0.9,en;q=0.8',
          'Accept-Encoding': 'identity',
        },
      },
      (res) => {
        const status = res.statusCode ?? 0;
        const contentType = String(res.headers['content-type'] ?? '');

        if (detectBotProtection(status, res.headers)) {
          res.destroy();
          reject(
            new SafeFetchError(
              'Portal blokuje automatyczne pobieranie. Skopiuj treść ogłoszenia i wklej ją ręcznie.',
              'BOT_PROTECTED',
              403
            )
          );
          return;
        }

        if (status >= 300 && status < 400 && res.headers.location) {
          res.destroy();
          resolve({ redirectTo: res.headers.location, contentType });
          return;
        }

        if (status < 200 || status >= 300) {
          res.destroy();
          reject(
            new SafeFetchError(
              `Serwer odpowiedział błędem ${status}.`,
              'UPSTREAM_ERROR',
              status
            )
          );
          return;
        }

        const isAllowedType =
          contentType === '' ||
          ALLOWED_CONTENT_TYPES.some((allowed) => contentType.toLowerCase().includes(allowed));
        if (!isAllowedType) {
          res.destroy();
          reject(
            new SafeFetchError(
              'Ten adres nie zwraca strony HTML.',
              'BAD_CONTENT_TYPE'
            )
          );
          return;
        }

        // Stop reading the moment the cap is exceeded rather than buffering
        // an arbitrarily large body into memory.
        const chunks: Buffer[] = [];
        let received = 0;
        res.on('data', (chunk: Buffer) => {
          received += chunk.length;
          if (received > MAX_BYTES) {
            res.destroy();
            reject(new SafeFetchError('Strona jest zbyt duża.', 'TOO_LARGE'));
            return;
          }
          chunks.push(chunk);
        });
        res.on('end', () => resolve({ body: Buffer.concat(chunks), contentType }));
        res.on('error', () =>
          reject(new SafeFetchError('Błąd odczytu odpowiedzi.', 'UPSTREAM_ERROR'))
        );
      }
    );

    req.setTimeout(TIMEOUT_MS, () => {
      req.destroy();
      reject(new SafeFetchError('Przekroczono czas oczekiwania na odpowiedź.', 'TIMEOUT'));
    });

    req.on('error', (err) => {
      if (err instanceof SafeFetchError) return reject(err);
      reject(new SafeFetchError('Nie udało się połączyć z serwerem.', 'UPSTREAM_ERROR'));
    });

    req.end();
  });
}

/**
 * Fetches HTML from a user-supplied URL with SSRF protections.
 *
 * Callers must not return the returned `html` to the client verbatim — extract the
 * fields you need and return only those. That way even a bypass of the checks here
 * yields no readable data to an attacker.
 */
export async function safeFetchHtml(rawUrl: string): Promise<SafeFetchResult> {
  let currentUrl = parseAndValidateUrl(rawUrl);

  for (let hop = 0; hop <= MAX_REDIRECTS; hop++) {
    const addresses = await resolveAllowedAddresses(currentUrl.hostname);
    const result = await requestOnce(currentUrl, addresses[0]);

    if (result.redirectTo) {
      // Re-validate from scratch on every hop — a public URL is allowed to
      // redirect to a private one, and only per-hop checking catches that.
      const next = new URL(result.redirectTo, currentUrl);
      currentUrl = parseAndValidateUrl(next.toString());
      continue;
    }

    const body = result.body ?? Buffer.alloc(0);
    const charset =
      charsetFromContentType(result.contentType) ?? charsetFromMeta(body) ?? 'utf-8';

    let html: string;
    try {
      // Polish job boards still serve ISO-8859-2 / windows-1250 in places;
      // decoding as UTF-8 would mangle every diacritic.
      html = new TextDecoder(charset).decode(body);
    } catch {
      html = body.toString('utf-8');
    }

    return { html, finalUrl: currentUrl.toString(), charset };
  }

  throw new SafeFetchError('Zbyt wiele przekierowań.', 'TOO_MANY_REDIRECTS');
}
