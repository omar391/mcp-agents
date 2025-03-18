import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { ErrorCode, McpError } from '@modelcontextprotocol/sdk/types.js';
import { PlaywrightRendererServer } from '../../src/src/index.js';
// import htmlToMd from 'html-to-md';

// vi.mock('html-to-md', async () => {
//   return {
//     __esModule: true,
//     default: vi.fn(),
//   };
// });

describe('PlaywrightRendererServer - renderMarkdown', () => {
  let server: PlaywrightRendererServer;

  beforeEach(() => {
    server = new PlaywrightRendererServer(false);
    // vi.clearAllMocks();
  });

  afterEach(() => {
    // vi.clearAllMocks();
  });

  it('should throw error for invalid arguments', async () => {
    await expect(server.renderMarkdown(null as any)).rejects.toThrow(McpError);
    await expect(server.renderMarkdown({} as any)).rejects.toThrow(McpError);
    await expect(server.renderMarkdown({ html: 123 } as any)).rejects.toThrow(McpError);
  });

  it('should convert HTML heading to markdown', async () => {
    // vi.mocked(htmlToMd).mockReturnValue('# Test');
    const result = await server.renderMarkdown({ html: '<h1>Test</h1>' });

    // expect(vi.mocked(htmlToMd)).toHaveBeenCalledWith('<h1>Test</h1>');
    expect(result.content[0].text).toBe('# Test');
  });

  it('should convert HTML paragraph with formatting to markdown', async () => {
    // vi.mocked(htmlToMd).mockReturnValue('Hello **World**');
    const result = await server.renderMarkdown({
      html: '<p>Hello <strong>World</strong></p>'
    });

    // expect(vi.mocked(htmlToMd)).toHaveBeenCalledWith('<p>Hello <strong>World</strong></p>');
    expect(result.content[0].text).toBe('Hello **World**');
  });
});