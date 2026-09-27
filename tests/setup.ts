import { vi } from 'vitest';

// Mock fetch เพื่อป้องกัน ECONNREFUSED บน CI/CD
global.fetch = vi.fn().mockImplementation((url) => {
  if (typeof url === 'string' && url.includes('3000')) {
    return Promise.resolve({
      ok: true,
      status: 200,
      json: () => Promise.resolve({ status: 'ok', message: 'mocked response' }),
      text: () => Promise.resolve('mocked response'),
    });
  }
  return Promise.resolve({
    ok: true,
    status: 200,
    json: () => Promise.resolve({}),
    text: () => Promise.resolve(''),
  });
});
