import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { getDiseaseInfo } from '../DiseaseService';

describe('getDiseaseInfo', () => {
  const REAL_FETCH = (globalThis as any).fetch;

  afterEach(() => {
    vi.restoreAllMocks();
    (globalThis as any).fetch = REAL_FETCH;
  });

  it('returns parsed object on success', async () => {
    const mockRes = { parsed: true, data: { symptoms: ['x'], causes: ['y'] }, source: 'groq' };
    (globalThis as any).fetch = vi.fn().mockResolvedValue({ ok: true, json: async () => mockRes, text: async () => JSON.stringify(mockRes) });

    const res = await getDiseaseInfo('Tomato', 'Early blight', 0.87);
    expect(res).toEqual(mockRes);
    expect((globalThis as any).fetch).toHaveBeenCalled();
  });

  it('throws on non-ok response', async () => {
    (globalThis as any).fetch = vi.fn().mockResolvedValue({ ok: false, text: async () => 'err' });
    await expect(getDiseaseInfo('Tomato', 'X', 0.1)).rejects.toThrow();
  });
});