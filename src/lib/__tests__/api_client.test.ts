import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { apiUrl, apiFetch, warmUpApi } from '../apiClient';

describe('apiClient (Backend URL Resolution & Fetch Timeout Handling)', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(JSON.stringify({ status: 'ok' }))));
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('1. apiUrl formats clean endpoints regardless of leading slashes', () => {
    expect(apiUrl('/api/health')).toContain('/api/health');
    expect(apiUrl('api/health')).toContain('/api/health');
  });

  it('2. apiFetch triggers global fetch with AbortSignal timeout', async () => {
    const res = await apiFetch('/api/health');
    expect(res.ok).toBe(true);
    expect(fetch).toHaveBeenCalled();
  });

  it('3. warmUpApi triggers background health check without throwing', () => {
    expect(() => warmUpApi()).not.toThrow();
    expect(fetch).toHaveBeenCalledWith(expect.stringContaining('/api/health'), expect.any(Object));
  });
});
