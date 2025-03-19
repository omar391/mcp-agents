import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { McpError } from '@modelcontextprotocol/sdk/types.js';
import { PlaywrightRendererServer } from '../../src/index.js';
import { setupServerMocks } from '../mocks/server-mocks';
import { TEST_HTML } from '../mocks/test-constants';

describe('PlaywrightRendererServer - fetchPage', () => {
    let server: PlaywrightRendererServer;

    beforeEach(() => {
        server = new PlaywrightRendererServer(false);
        setupServerMocks(server);
    });

    afterEach(() => {
        vi.clearAllMocks();
    });

    it('should throw error for invalid arguments', async () => {
        await expect(server.fetchPage(null)).rejects.toThrow(McpError);
        await expect(server.fetchPage({})).rejects.toThrow(McpError);
        await expect(server.fetchPage({ url: 123 })).rejects.toThrow(McpError);
    });

    it('should fetch a webpage and return the HTML content', async () => {
        const result = await server.fetchPage({ url: 'https://example.com' });

        expect(result.content[0].type).toBe('text');
        expect(result.content[0].text).toBe(TEST_HTML.BASIC);
    });
});