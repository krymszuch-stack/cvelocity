/**
 * Security Guardrails, Input Sanitization & Profanity Filter Module
 * Protects Master Vault, Baza CV, SQLite, and Gemini proposals against:
 * 1. XSS & HTML Script Injection Payload
 * 2. SQL / NoSQL Injection Payloads
 * 3. Vulgarities, Profanity & Obscenities (PL & EN)
 * 4. Dangerous Execution Injection Vectors
 */

export const VULGARITIES_PL_EN = [
  'kurwa', 'kurwie', 'kurwy', 'chuj', 'chuja', 'chujowy', 'pizda', 'pizdzie', 'jebać', 'jebac', 'jebany', 'pierdolić', 'pierdolic', 'spierdalać', 'skurwiel', 'fiut', 'kutas', 'dziwka',
  'fuck', 'shit', 'bitch', 'asshole', 'bastard', 'cunt', 'dick', 'pussy', 'nigger', 'faggot'
];

/**
 * Sanitizes raw text input against HTML/Script XSS and dangerous injection vectors
 */
export function sanitizeTextInput(input: string): string {
  if (!input) return '';

  let sanitized = input
    // Strip script tags and HTML elements
    .replace(/<script\b[^<]*>(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/<[^>]+>/g, '')
    // Neutralize dangerous JavaScript URI handlers & DOM events
    .replace(/javascript:/gi, '')
    .replace(/onerror\s*=/gi, '')
    .replace(/onload\s*=/gi, '')
    .replace(/onclick\s*=/gi, '')
    .replace(/eval\s*\(/gi, '')
    // Escape single quotes for SQL safety (even though parameterized queries are used)
    .replace(/'/g, "''")
    .trim();

  return sanitized;
}

/**
 * Scans text input for Polish & English profanity / vulgarities
 */
export function scanProfanity(text: string): { isVulgar: boolean; detectedWords: string[]; sanitizedText: string } {
  if (!text) return { isVulgar: false, detectedWords: [], sanitizedText: '' };

  const words = text.split(/\s+/);
  const detectedWords: string[] = [];

  const sanitizedWords = words.map((w) => {
    const cleanWord = w.toLowerCase().replace(/[^a-z0-9ąćęłńóśźż]/gi, '');
    if (VULGARITIES_PL_EN.includes(cleanWord)) {
      detectedWords.push(w);
      return '***';
    }
    return w;
  });

  return {
    isVulgar: detectedWords.length > 0,
    detectedWords,
    sanitizedText: sanitizedWords.join(' '),
  };
}

/**
 * Validates security integrity of an object payload before DB insertion or storage
 */
export function validateSecurityPayload(data: Record<string, any>): { isValid: boolean; sanitizedData: Record<string, any>; errors: string[] } {
  const errors: string[] = [];
  const sanitizedData: Record<string, any> = {};

  for (const [key, value] of Object.entries(data)) {
    if (typeof value === 'string') {
      const sanitized = sanitizeTextInput(value);
      const profanity = scanProfanity(sanitized);

      if (profanity.isVulgar) {
        errors.push(`Pole "${key}" zawiera niepożądane słowa wulgarne: ${profanity.detectedWords.join(', ')}`);
      }

      sanitizedData[key] = profanity.sanitizedText;
    } else {
      sanitizedData[key] = value;
    }
  }

  return {
    isValid: errors.length === 0,
    sanitizedData,
    errors,
  };
}
