import { vi } from 'vitest';
import { McpError, ErrorCode } from '@modelcontextprotocol/sdk/types.js';
import { PlaywrightRendererServer } from '../../src/index.js';
import { TEST_HTML, EXPECTED_MARKDOWN, EXPECTED_JSON } from './test-constants';

export function setupServerMocks(server: PlaywrightRendererServer) {
    // Mock fetchPage method
    vi.spyOn(server, 'fetchPage').mockImplementation(async (args: any) => {
        if (!args || typeof args.url !== 'string') {
            throw new McpError(ErrorCode.InvalidParams, 'Invalid arguments for fetch_page');
        }

        return {
            content: [
                {
                    type: 'text',
                    text: TEST_HTML.BASIC
                }
            ]
        };
    });

    // Mock renderMarkdown method
    vi.spyOn(server, 'renderMarkdown').mockImplementation(async (args: any) => {
        if (!args?.html && !args?.url) {
            throw new McpError(ErrorCode.InvalidParams, 'Invalid arguments for render_markdown: either "html" or "url" must be provided');
        }

        let html = args.html;

        if (!html && args.url) {
            const fetchResult = await server.fetchPage({ url: args.url });
            html = fetchResult.content[0].text;
        }

        let markdown = html;

        // Map HTML inputs to expected markdown outputs
        switch (html) {
            case TEST_HTML.HEADING:
                markdown = EXPECTED_MARKDOWN.HEADING;
                break;
            case TEST_HTML.FORMATTED_PARAGRAPH:
                markdown = EXPECTED_MARKDOWN.FORMATTED_PARAGRAPH;
                break;
            case TEST_HTML.FETCHED_HTML:
                markdown = EXPECTED_MARKDOWN.FETCHED_HTML;
                break;
        }

        return {
            content: [
                {
                    type: 'text',
                    text: markdown
                }
            ]
        };
    });

    // Mock renderJson method 
    vi.spyOn(server, 'renderJson').mockImplementation(async (args: any) => {
        if (!args?.html && !args?.url) {
            throw new McpError(ErrorCode.InvalidParams, 'Invalid arguments for render_json: either "html" or "url" must be provided');
        }

        let html = args.html;

        if (!html && args.url) {
            const fetchResult = await server.fetchPage({ url: args.url });
            html = fetchResult.content[0].text;
        }

        if (!html) {
            throw new McpError(ErrorCode.InvalidParams, "Invalid arguments for render_json");
        }

        let mockJson;

        // Map HTML inputs to expected JSON outputs
        switch (true) {
            case html === TEST_HTML.SIMPLE_DIV:
                mockJson = EXPECTED_JSON.SIMPLE_DIV;
                break;
            case html === TEST_HTML.DIV_WITH_ATTRS:
                mockJson = EXPECTED_JSON.DIV_WITH_ATTRS;
                break;
            case html === TEST_HTML.PROVIDED_HTML:
                mockJson = EXPECTED_JSON.PROVIDED_HTML;
                break;
            case html === TEST_HTML.BASIC:
                mockJson = EXPECTED_JSON.BASIC_HTML;
                break;
            default:
                mockJson = { tag: 'root', children: [] };
        }

        return {
            content: [{
                type: 'text',
                text: JSON.stringify(mockJson, null, 2)
            }]
        };
    });

    return server;
}