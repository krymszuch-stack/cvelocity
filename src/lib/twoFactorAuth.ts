import * as OTPAuth from 'otpauth';
import QRCode from 'qrcode';

const ISSUER = 'SkillVault';

export interface TwoFactorSetup {
  secret: string; // base32 secret, store on the user's account record
  otpauthUrl: string; // otpauth:// URI for manual entry / QR encoding
  qrCodeDataUrl: string; // ready-to-render <img src> data URL
}

/**
 * Generates a new TOTP secret + QR code for enabling 2FA. The user scans this once
 * with an authenticator app (Google Authenticator, Authy, 1Password, ...); nothing
 * is sent over the network — everything here runs client-side.
 */
export async function generateTwoFactorSetup(accountLabel: string): Promise<TwoFactorSetup> {
  const totp = new OTPAuth.TOTP({
    issuer: ISSUER,
    label: accountLabel,
    algorithm: 'SHA1',
    digits: 6,
    period: 30,
    secret: new OTPAuth.Secret({ size: 20 }),
  });

  const otpauthUrl = totp.toString();
  const qrCodeDataUrl = await QRCode.toDataURL(otpauthUrl, { margin: 1, width: 220 });

  return {
    secret: totp.secret.base32,
    otpauthUrl,
    qrCodeDataUrl,
  };
}

/**
 * Verifies a 6-digit code against a stored base32 secret. Allows a small window
 * (± 1 time-step, 30s each) to tolerate minor clock drift between devices.
 */
export function verifyTwoFactorToken(secretBase32: string, token: string): boolean {
  const cleanToken = token.trim().replace(/\s+/g, '');
  if (!/^\d{6}$/.test(cleanToken)) return false;

  const totp = new OTPAuth.TOTP({
    issuer: ISSUER,
    algorithm: 'SHA1',
    digits: 6,
    period: 30,
    secret: OTPAuth.Secret.fromBase32(secretBase32),
  });

  const delta = totp.validate({ token: cleanToken, window: 1 });
  return delta !== null;
}
