import { describe, it, expect, vi, beforeEach } from 'vitest';
import { executeAiOperation, reserveAiQuota, refundAiQuota, QuotaExceededError } from '../quota';
import * as supabaseModule from '../supabase';

vi.mock('../supabase');
vi.mock('../usageLedger', () => ({
  recordUsage: vi.fn(),
}));

describe('Atomic Quota Reservation & Refund', () => {
  const mockRpc = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(supabaseModule, 'getSupabase').mockReturnValue({
      rpc: mockRpc,
    } as any);
  });

  it('reserveAiQuota wywołuje RPC reserve_ai_quota z prawidłowymi parametrami', async () => {
    mockRpc.mockResolvedValueOnce({ data: { allowed: true, current_uses: 1 }, error: null });

    const res = await reserveAiQuota('user-123', 5);
    expect(mockRpc).toHaveBeenCalledWith('reserve_ai_quota', {
      p_user_id: 'user-123',
      p_max_daily_uses: 5,
    });
    expect(res).toEqual({ allowed: true, current_uses: 1 });
  });

  it('refundAiQuota wywołuje RPC refund_ai_quota z ID użytkownika', async () => {
    mockRpc.mockResolvedValueOnce({ data: null, error: null });

    await refundAiQuota('user-123');
    expect(mockRpc).toHaveBeenCalledWith('refund_ai_quota', {
      p_user_id: 'user-123',
    });
  });

  it('executeAiOperation pomyślnie rezerwuje, wykonuje zadanie i zwraca wynik', async () => {
    mockRpc.mockResolvedValueOnce({ data: { allowed: true, current_uses: 1 }, error: null });

    const task = vi.fn().mockResolvedValueOnce({
      data: { success: true },
      usage: { promptTokens: 100, completionTokens: 50, model: 'gemini-2.5-flash-lite' },
    });

    const result = await executeAiOperation('user-123', 'FREE', 'test-context', task);

    expect(result).toEqual({ success: true });
    expect(task).toHaveBeenCalled();
  });

  it('executeAiOperation rzuca QuotaExceededError gdy rezerwacja zostaje odrzucona', async () => {
    mockRpc.mockResolvedValueOnce({ data: { allowed: false, current_uses: 5 }, error: null });

    const task = vi.fn();

    await expect(executeAiOperation('user-123', 'FREE', 'test-context', task)).rejects.toThrow(
      QuotaExceededError
    );
    expect(task).not.toHaveBeenCalled();
  });

  it('executeAiOperation wykonuje refund_ai_quota w przypadku awarii zadania LLM', async () => {
    mockRpc.mockResolvedValueOnce({ data: { allowed: true, current_uses: 1 }, error: null }); // dla reserve
    mockRpc.mockResolvedValueOnce({ data: null, error: null }); // dla refund

    const task = vi.fn().mockRejectedValueOnce(new Error('LLM Timeout'));

    await expect(executeAiOperation('user-123', 'FREE', 'test-context', task)).rejects.toThrow(
      'LLM Timeout'
    );

    expect(mockRpc).toHaveBeenLastCalledWith('refund_ai_quota', {
      p_user_id: 'user-123',
    });
  });
});
