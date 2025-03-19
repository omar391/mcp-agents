import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { McpError } from '@modelcontextprotocol/sdk/types.js';
import { PlaywrightRendererServer } from '../../src/index.js';
import { setupServerMocks } from '../mocks/server-mocks';
import { TEST_HTML, EXPECTED_MARKDOWN } from '../mocks/test-constants';

describe('PlaywrightRendererServer - renderMarkdown', () => {
  let server: PlaywrightRendererServer;

  beforeEach(() => {
    server = new PlaywrightRendererServer(false);
    setupServerMocks(server);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('should throw error for invalid arguments', async () => {
    await expect(server.renderMarkdown(null as any)).rejects.toThrow(McpError);
    await expect(server.renderMarkdown({} as any)).rejects.toThrow(McpError);
  });

  it('should convert HTML heading to markdown', async () => {
    const result = await server.renderMarkdown({ html: TEST_HTML.HEADING });
    expect(result.content[0].text).toBe(EXPECTED_MARKDOWN.HEADING);
  });

  it('should convert HTML paragraph with formatting to markdown', async () => {
    const result = await server.renderMarkdown({
      html: TEST_HTML.FORMATTED_PARAGRAPH
    });

    expect(result.content[0].text).toBe(EXPECTED_MARKDOWN.FORMATTED_PARAGRAPH);
  });

  it('should fetch HTML from URL and convert to markdown', async () => {
    const result = await server.renderMarkdown({ url: 'http://example.com' });

    expect(result.content[0].type).toBe('text');
    expect(result.content[0].text).toBe(TEST_HTML.BASIC);
  });
});