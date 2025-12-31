import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import http from 'http';
import { createServer } from '../../server/index';

// Helper to mock fetch responses
function mockFetchResponse(bodyObj: any, ok = true) {
  return vi.fn().mockResolvedValue({
    ok,
    json: async () => bodyObj,
    text: async () => (typeof bodyObj === 'string' ? bodyObj : JSON.stringify(bodyObj)),
  });
}

describe('/api/disease/info', () => {
  let server: http.Server;
  let baseUrl: string;
  const REAL_FETCH = (globalThis as any).fetch;

  beforeEach((ctx) => {
    const app = createServer();
    server = http.createServer(app);
    // start listening on ephemeral port
    return new Promise<void>((resolve) => {
      server.listen(0, async () => {
        const addr: any = server.address();
        baseUrl = `http://127.0.0.1:${addr.port}`;
        // ensure environment SERVER_BASE_URL points to this server for internal fetches
        process.env.SERVER_BASE_URL = baseUrl;
        vi.restoreAllMocks();
        // Clear server cache between tests
        const diseaseModule = await import('../../server/routes/disease');
        diseaseModule._clearDiseaseInfoCache();
        resolve();
      });
    });
  });

  afterEach(() => {
    server.close();
  });

  it('parses well-formed JSON returned by chatbot', async () => {
    const chatbotMessage = JSON.stringify({
      symptoms: ['brown spots', 'leaf curling'],
      causes: ['fungal infection'],
      treatments: [{ step: 'remove infected leaves' }],
      precautions: ['avoid overhead watering']
    });

    (globalThis as any).fetch = mockFetchResponse({ message: chatbotMessage, model: 'groq' });

    const res = await REAL_FETCH(`${baseUrl}/api/disease/info`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ crop: 'Tomato', disease: 'Tomato___Early_blight' }) });
    const body = await res.json();
    expect(res.status).toBe(200);
    expect(body.parsed).toBe(true);
    expect(body.data.symptoms).toBeDefined();
    expect((globalThis as any).fetch).toHaveBeenCalled();
  });

  it('parses JSON substring inside chatbot text', async () => {
    const chatbotText = "Intro text: {\"symptoms\":[\"lesions\"],\"causes\":[\"fungus\"]} End.";
    (globalThis as any).fetch = mockFetchResponse({ message: chatbotText, model: 'groq' });

    const res = await REAL_FETCH(`${baseUrl}/api/disease/info`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ crop: 'Grape', disease: 'Grape___Black_rot' }) });
    const body = await res.json();
    expect(res.status).toBe(200);
    expect(body.parsed).toBe(true);
    expect(body.data.symptoms[0]).toBe('lesions');
  });

  it('returns raw when chatbot response cannot be parsed', async () => {
    (globalThis as any).fetch = mockFetchResponse({ message: 'I am not sure about that' });

    const res = await REAL_FETCH(`${baseUrl}/api/disease/info`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ crop: 'Tomato', disease: 'Tomato___Unknown' }) });
    const body = await res.json();
    expect(res.status).toBe(200);
    expect(body.parsed).toBe(false);
    expect(body.raw).toBeDefined();
  });

  it('handles chatbot timeout (AbortError) gracefully', async () => {
    (globalThis as any).fetch = vi.fn().mockImplementation(() => {
      const e: any = new Error('aborted');
      e.name = 'AbortError';
      throw e;
    });

    const res = await REAL_FETCH(`${baseUrl}/api/disease/info`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ crop: 'Tomato', disease: 'Tomato___Early_blight' }) });
    const body = await res.json();
    expect(res.status).toBe(504);
    expect(body.error).toMatch(/timed out/i);
  });

  it('caches parsed results to avoid repeated chatbot calls', async () => {
    const chatbotMessage = JSON.stringify({
      symptoms: ['brown spots'],
      causes: ['fungus'],
      treatments: [{ step: 'prune' }],
      precautions: ['isolate plants']
    });

    const fetchMock = mockFetchResponse({ message: chatbotMessage, model: 'groq' });
    (globalThis as any).fetch = fetchMock;

    const payload = { crop: 'Tomato', disease: 'Tomato___Early_blight' };
    const r1 = await REAL_FETCH(`${baseUrl}/api/disease/info`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
    const res1 = await r1.json();
    expect(r1.status).toBe(200);
    expect(res1.parsed).toBe(true);

    const r2 = await REAL_FETCH(`${baseUrl}/api/disease/info`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
    const res2 = await r2.json();
    expect(r2.status).toBe(200);
    expect(res2.source).toBe('cache');

    // fetch should have been called only once (due to cache hit)
    expect((globalThis as any).fetch).toHaveBeenCalledTimes(1);
  });
});
