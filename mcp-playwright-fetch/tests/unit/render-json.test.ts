import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { ErrorCode, McpError } from '@modelcontextprotocol/sdk/types.js';
import type { CheerioAPI, Cheerio } from 'cheerio';
import { PlaywrightRendererServer } from '../../src/src/index.js';
import * as cheerio from 'cheerio';

describe('PlaywrightRendererServer - renderJson', () => {
    let server: PlaywrightRendererServer;

    const createTextNode = (content: string) => ({
        type: 'text',
        data: content
    });

    const createMockElement = (tagName: string, attributes = {}, children: any[] = []): any => {
        const element = {
            type: 'tag',
            name: tagName,
            attribs: Object.keys(attributes).length > 0 ? attributes : undefined,
            children: children
        };

        return {
            [0]: element,
            prop: vi.fn(),
            attr: vi.fn().mockImplementation(() => attributes),
            contents: vi.fn().mockReturnValue({ get: () => children }),
            text: vi.fn().mockImplementation(() => {
                const textNode = children.find(c => c.type === 'text');
                return textNode ? textNode.data : '';
            })
        };
    };

    const createCheerioAPI = (rootElement: any): CheerioAPI => {
        const $ = function(selector: string | any): any {
            if (typeof selector === 'string' && (selector === ':root' || selector.startsWith(':'))) {
                return rootElement;
            }
            // When wrapping a node, create a new cheerio-like object
            if (selector && typeof selector === 'object') {
                return {
                    [0]: selector,
                    contents: () => ({ get: () => selector.children || [] })
                };
            }
        } as unknown as CheerioAPI;
        
        $.load = vi.fn();
        return $;
    };

    beforeEach(() => {
        vi.clearAllMocks();
        server = new PlaywrightRendererServer(false);
    });

    afterEach(() => {
        vi.clearAllMocks();
    });

    it('should throw error for invalid arguments', async () => {
        await expect(server.renderJson(null as any)).rejects.toThrow(McpError);
        await expect(server.renderJson({} as any)).rejects.toThrow(McpError);
        await expect(server.renderJson({ html: 123 } as any)).rejects.toThrow(McpError);
    });

    it('should convert simple HTML to JSON', async () => {
        const textNode = createTextNode('Hello');
        const pElement = createMockElement('p', {}, [textNode]);
        const divElement = createMockElement('div', {}, [pElement[0]]);
        
        const mockCheerioLoad = vi.fn().mockImplementation(() => createCheerioAPI(divElement));
        vi.spyOn(cheerio, 'load').mockImplementation(mockCheerioLoad);

        const result = await server.renderJson({ html: '<div><p>Hello</p></div>' });
        expect(result).toEqual({
            content: [{
                type: 'text',
                text: JSON.stringify({
                    tag: 'div',
                    children: [{
                        tag: 'p',
                        children: [{
                            type: 'text',
                            value: 'Hello'
                        }]
                    }]
                }, null, 2)
            }]
        });
    });

    it('should convert HTML with attributes to JSON', async () => {
        const textNode = createTextNode('Title');
        const h1Element = createMockElement('h1', { class: 'title' }, [textNode]);
        const divElement = createMockElement('div', { id: 'root' }, [h1Element[0]]);
        
        const mockCheerioLoad = vi.fn().mockImplementation(() => createCheerioAPI(divElement));
        vi.spyOn(cheerio, 'load').mockImplementation(mockCheerioLoad);

        const result = await server.renderJson({
            html: '<div id="root"><h1 class="title">Title</h1></div>'
        });

        expect(result).toEqual({
            content: [{
                type: 'text',
                text: JSON.stringify({
                    tag: 'div',
                    attributes: { id: 'root' },
                    children: [{
                        tag: 'h1',
                        attributes: { class: 'title' },
                        children: [{
                            type: 'text',
                            value: 'Title'
                        }]
                    }]
                }, null, 2)
            }]
        });
    });
});