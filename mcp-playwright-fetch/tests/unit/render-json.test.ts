import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { McpError } from '@modelcontextprotocol/sdk/types.js';
import { PlaywrightRendererServer } from '../../src/index.js';
import { setupServerMocks } from '../mocks/server-mocks';
import { TEST_HTML, EXPECTED_JSON } from '../mocks/test-constants';

describe('PlaywrightRendererServer - renderJson', () => {
    let server: PlaywrightRendererServer;

    beforeEach(() => {
        server = new PlaywrightRendererServer(false);
        setupServerMocks(server);
    });

    afterEach(() => {
        vi.clearAllMocks();
    });

    it('should throw error for invalid arguments', async () => {
        await expect(server.renderJson(null as any)).rejects.toThrow(McpError);
        await expect(server.renderJson({} as any)).rejects.toThrow(McpError);
    });

    it('should convert simple HTML to JSON', async () => {
        const result = await server.renderJson({ html: TEST_HTML.SIMPLE_DIV });
        const json = JSON.parse(result.content[0].text);

        expect(json).toEqual(EXPECTED_JSON.SIMPLE_DIV);
    });

    it('should convert HTML with attributes to JSON', async () => {
        const result = await server.renderJson({
            html: TEST_HTML.DIV_WITH_ATTRS
        });

        const json = JSON.parse(result.content[0].text);
        expect(json).toEqual(EXPECTED_JSON.DIV_WITH_ATTRS);
    });

    it('should fetch HTML from URL and convert to JSON', async () => {
        const result = await server.renderJson({ url: 'http://example.com' });
        const json = JSON.parse(result.content[0].text);

        expect(json).toEqual(EXPECTED_JSON.BASIC_HTML);
    });

    it('should prioritize HTML content over URL if both are provided', async () => {
        const result = await server.renderJson({
            html: TEST_HTML.PROVIDED_HTML,
            url: 'http://example.com'
        });

        const json = JSON.parse(result.content[0].text);
        expect(json).toEqual(EXPECTED_JSON.PROVIDED_HTML);
    });
});