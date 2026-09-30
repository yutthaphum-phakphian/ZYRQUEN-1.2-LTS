import { vi } from 'vitest';

// Mock HTMLCanvasElement.prototype.getContext สำหรับสภาพแวดล้อม happy-dom / CI
if (typeof HTMLCanvasElement !== 'undefined') {
  HTMLCanvasElement.prototype.getContext = vi.fn().mockImplementation((contextId: string) => {
    if (contextId === '2d') {
      return {
        fillRect: vi.fn(),
        clearRect: vi.fn(),
        getImageData: vi.fn(() => ({ data: new Uint8ClampedArray(4) })),
        putImageData: vi.fn(),
        createImageData: vi.fn(() => ({ data: new Uint8ClampedArray(4) })),
        setTransform: vi.fn(),
        drawImage: vi.fn(),
        save: vi.fn(),
        fillText: vi.fn(),
        strokeText: vi.fn(),
        restore: vi.fn(),
        beginPath: vi.fn(),
        moveTo: vi.fn(),
        lineTo: vi.fn(),
        closePath: vi.fn(),
        stroke: vi.fn(),
        fill: vi.fn(),
        arc: vi.fn(),
        strokeRect: vi.fn(),
        measureText: vi.fn(() => ({ width: 0, height: 0 })),
        transform: vi.fn(),
        rect: vi.fn(),
        clip: vi.fn(),
        scale: vi.fn(),
        rotate: vi.fn(),
        translate: vi.fn(),
        arcTo: vi.fn(),
        bezierCurveTo: vi.fn(),
        quadraticCurveTo: vi.fn(),
        createLinearGradient: vi.fn(() => ({ addColorStop: vi.fn() })),
        createRadialGradient: vi.fn(() => ({ addColorStop: vi.fn() })),
        createPattern: vi.fn(),
        setLineDash: vi.fn(),
        getLineDash: vi.fn(() => []),
        canvas: document.createElement('canvas'),
      };
    }
    return null;
  }) as any;
}

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
