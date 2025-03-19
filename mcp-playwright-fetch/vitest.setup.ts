// vitest.setup.ts
import { vi } from 'vitest';
import { TEST_HTML } from './tests/mocks/test-constants';

// Expose vi globally for use in test files
Object.defineProperty(globalThis, 'vi', { value: vi });

// Log test environment for debugging
console.log('Test environment:', process.env.TEST_TYPE);

// Mock html-to-md to return predictable output
vi.mock('html-to-md', () => ({
  default: vi.fn().mockImplementation((html: string) => html)
}));

// Only mock Playwright for unit tests
if (process.env.TEST_TYPE === 'unit') {
  console.log('Setting up Playwright mock for unit tests');

  // Mock Playwright for direct usage cases
  vi.mock('playwright', () => {
    const mockPage = {
      goto: vi.fn().mockResolvedValue(undefined),
      waitForLoadState: vi.fn().mockResolvedValue(undefined),
      content: vi.fn().mockResolvedValue(TEST_HTML.BASIC),
      on: vi.fn()
    };

    const mockContext = {
      newPage: vi.fn().mockResolvedValue(mockPage)
    };

    const mockBrowser = {
      newContext: vi.fn().mockResolvedValue(mockContext),
      close: vi.fn().mockResolvedValue(undefined)
    };

    return {
      chromium: {
        launch: vi.fn().mockResolvedValue(mockBrowser)
      }
    };
  });
} else {
  console.log('Using real implementations for integration tests');
}

// Mock MCP SDK dependencies
vi.mock('@modelcontextprotocol/sdk/server/stdio.js', () => ({
  StdioServerTransport: vi.fn().mockImplementation(() => ({}))
}));

vi.mock('@modelcontextprotocol/sdk/server/index.js', () => ({
  Server: vi.fn().mockImplementation(() => ({
    setRequestHandler: vi.fn(),
    connect: vi.fn(),
    close: vi.fn(),
    onerror: vi.fn()
  }))
}));