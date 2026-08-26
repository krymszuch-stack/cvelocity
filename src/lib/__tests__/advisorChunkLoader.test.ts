import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  ADVISOR_MAX_ATTEMPTS,
  loadAdvisorChunk,
  resetAdvisorChunkCache,
} from '../../features/advisor/advisorChunkLoader';

const chunkError = () => new TypeError('Failed to fetch dynamically imported module');

beforeEach(() => {
  resetAdvisorChunkCache();
});

describe('loader chunka Doradcy', () => {
  it('po chwilowej awarii ponawia import z wykładniczym backoffem', async () => {
    const module = { GeminiAdvisorModal: () => null } as unknown as typeof import('../../features/advisor/GeminiAdvisorModal');
    const importer = vi.fn()
      .mockRejectedValueOnce(chunkError())
      .mockRejectedValueOnce(chunkError())
      .mockResolvedValue(module);
    const delays: number[] = [];

    const result = await loadAdvisorChunk(
      importer,
      async (delay) => { delays.push(delay); },
      () => 0.5,
    );

    expect(result).toBe(module);
    expect(importer).toHaveBeenCalledTimes(3);
    expect(delays).toEqual([500, 1_000]);
  });

  it('kończy po ustalonym limicie prób i zachowuje traceback błędu', async () => {
    const error = chunkError();
    const importer = vi.fn().mockRejectedValue(error);

    await expect(loadAdvisorChunk(importer, async () => undefined, () => 0.5)).rejects.toBe(error);
    expect(importer).toHaveBeenCalledTimes(ADVISOR_MAX_ATTEMPTS);
    expect((error as Error & { advisorChunkAttempt?: number }).advisorChunkAttempt).toBe(3);
    expect(error.stack).toBeTruthy();
  });

  it('nie ponawia błędu wykonania modułu, który nie jest awarią sieciową chunka', async () => {
    const importer = vi.fn().mockRejectedValue(new Error('Błąd składni modułu'));

    await expect(loadAdvisorChunk(importer, async () => undefined)).rejects.toThrow('Błąd składni');
    expect(importer).toHaveBeenCalledTimes(1);
  });
});