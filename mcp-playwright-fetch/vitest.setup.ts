// vitest.setup.ts
import { vi } from 'vitest';

// Expose vi globally for use in test files
Object.defineProperty(globalThis, 'vi', { value: vi });

// Configure Vitest for ESM
vi.mock('cheerio', async () => {
    const actual = await vi.importActual('cheerio');
    return {
        ...actual,
        load: vi.fn()
    };
});

vi.mock('html-to-md', async () => {
    return {
        default: vi.fn()
    };
});

vi.mock('playwright', async () => {
    return {
        chromium: {
            launch: vi.fn()
        }
    };
});

vi.mock('html-to-md', async () => ({
    default: vi.fn().mockImplementation((html: string) => {
        // Default mock implementation
        return html;
    })
}));

// Mock MCP SDK dependencies
vi.mock('@modelcontextprotocol/sdk/server/stdio.js', async () => {
    return {
        StdioServerTransport: vi.fn().mockImplementation(() => ({
            // Add mock methods if needed
        }))
    };
});

vi.mock('@modelcontextprotocol/sdk/server/index.js', async () => {
    return {
        Server: vi.fn().mockImplementation(() => ({
            setRequestHandler: vi.fn(),
            connect: vi.fn(),
            close: vi.fn(),
            onerror: vi.fn()
        }))
    };
});