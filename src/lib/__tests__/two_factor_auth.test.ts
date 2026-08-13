import { describe, it, expect } from 'vitest';
import * as OTPAuth from 'otpauth';
import { generateTwoFactorSetup, verifyTwoFactorToken } from '../twoFactorAuth';

function codeFor(secretBase32: string): string {
  const totp = new OTPAuth.TOTP({
    issuer: 'CVELOCITY',
    algorithm: 'SHA1',
    digits: 6,
    period: 30,
    secret: OTPAuth.Secret.fromBase32(secretBase32),
  });
  return totp.generate();
}

describe('twoFactorAuth (TOTP 2FA)', () => {
  it('generuje sekret, otpauth URL i kod QR gotowy do wyświetlenia', async () => {
    const setup = await generateTwoFactorSetup('jan.kowalski@example.com');
    expect(setup.secret).toMatch(/^[A-Z2-7]+=*$/); // base32
    expect(setup.otpauthUrl).toMatch(/^otpauth:\/\/totp\//);
    expect(setup.qrCodeDataUrl).toMatch(/^data:image\/png;base64,/);
  });

  it('akceptuje aktualnie ważny kod TOTP wygenerowany z tego samego sekretu', async () => {
    const setup = await generateTwoFactorSetup('anna.nowak@example.com');
    const validCode = codeFor(setup.secret);
    expect(verifyTwoFactorToken(setup.secret, validCode)).toBe(true);
  });

  it('odrzuca nieprawidłowy kod', async () => {
    const setup = await generateTwoFactorSetup('test@example.com');
    const validCode = codeFor(setup.secret);
    const wrongCode = validCode === '000000' ? '111111' : '000000';
    expect(verifyTwoFactorToken(setup.secret, wrongCode)).toBe(false);
  });

  it('odrzuca kod o nieprawidłowym formacie (nie 6 cyfr)', async () => {
    const setup = await generateTwoFactorSetup('test2@example.com');
    expect(verifyTwoFactorToken(setup.secret, '123')).toBe(false);
    expect(verifyTwoFactorToken(setup.secret, 'abcdef')).toBe(false);
    expect(verifyTwoFactorToken(setup.secret, '')).toBe(false);
  });

  it('kod z innego sekretu nie przechodzi weryfikacji', async () => {
    const setupA = await generateTwoFactorSetup('a@example.com');
    const setupB = await generateTwoFactorSetup('b@example.com');
    const codeForB = codeFor(setupB.secret);
    expect(verifyTwoFactorToken(setupA.secret, codeForB)).toBe(false);
  });
});
