import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { ErrorCode, McpError } from '@modelcontextprotocol/sdk/types.js';
import { PlaywrightRendererServer } from '../../src/index.js';
// import { chromium } from 'playwright';

describe('PlaywrightRendererServer - fetchPage', () => {
    let server: PlaywrightRendererServer;
    // let mockPage: any;
    // let mockContext: any;
    // let mockBrowser: any;

    beforeEach(() => {
        // vi.clearAllMocks();

        // // Setup mock page, context and browser
        // mockPage = {
        //     goto: vi.fn().mockResolvedValue(undefined),
        //     waitForLoadState: vi.fn().mockResolvedValue(undefined),
        //     content: vi.fn().mockResolvedValue('<html><body><h1>Test Page</h1></body></html>')
        // };

        // mockContext = {
        //     newPage: vi.fn().mockResolvedValue(mockPage)
        // };

        // mockBrowser = {
        //     newContext: vi.fn().mockResolvedValue(mockContext),
        //     close: vi.fn().mockResolvedValue(undefined)
        // };

    //  vi.spyOn(chromium, 'launch').mockResolvedValue(mockBrowser as any);

        // Create a new server instance
        server = new PlaywrightRendererServer(false);
    });

    afterEach(() => {
        // vi.clearAllMocks();
    });

    it('should throw error for invalid arguments', async () => {
        await expect(server.fetchPage(null)).rejects.toThrow(McpError);
        await expect(server.fetchPage({})).rejects.toThrow(McpError);
        await expect(server.fetchPage({ url: 123 })).rejects.toThrow(McpError);
    });

    it('should fetch a webpage and return the HTML content', async () => {
        const result = await server.fetchPage({ url: 'https://example.com' });

        // // Verify Playwright API is called correctly
        // expect(chromium.launch).toHaveBeenCalled();
        // expect(mockBrowser.newContext).toHaveBeenCalled();
        // expect(mockContext.newPage).toHaveBeenCalled();
        // expect(mockPage.goto).toHaveBeenCalledWith('https://example.com');
        // expect(mockPage.waitForLoadState).toHaveBeenCalledWith('networkidle');
        // expect(mockPage.content).toHaveBeenCalled();

        // // Verify browser is closed
        // expect(mockBrowser.close).toHaveBeenCalled();

        // Verify correct result is returned
        expect(result.content[0].text).toContain('Example Domain');
    });
});