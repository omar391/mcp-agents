// filepath: /Users/omar/Documents/Cline/MCP/mcp-playwright-fetch/tests/mocks/test-constants.ts
export const TEST_HTML = {
    // Standard test HTML for most tests
    BASIC: '<!DOCTYPE html><html><body><h1>Test Page</h1></body></html>',

    // Simple HTML snippets
    SIMPLE_DIV: '<div><p>Hello</p></div>',
    DIV_WITH_ATTRS: '<div id="root"><h1 class="title">Title</h1></div>',
    PROVIDED_HTML: '<div><p>Provided HTML</p></div>',

    // Markdown test cases
    HEADING: '<h1>Test</h1>',
    FORMATTED_PARAGRAPH: '<p>Hello <strong>World</strong></p>',
    FETCHED_HTML: '<p>Fetched HTML</p>'
};

export const EXPECTED_MARKDOWN = {
    HEADING: '# Test',
    FORMATTED_PARAGRAPH: 'Hello **World**',
    FETCHED_HTML: 'Fetched HTML'
};

export const EXPECTED_JSON = {
    // Simple div structure
    SIMPLE_DIV: {
        tag: 'root',
        children: [{
            tag: 'div',
            children: [{
                tag: 'p',
                children: [{
                    type: 'text',
                    value: 'Hello'
                }]
            }]
        }]
    },

    // Div with attributes
    DIV_WITH_ATTRS: {
        tag: 'root',
        children: [{
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
        }]
    },

    // Provided HTML structure
    PROVIDED_HTML: {
        tag: 'root',
        children: [{
            tag: 'div',
            children: [{
                tag: 'p',
                children: [{
                    type: 'text',
                    value: 'Provided HTML'
                }]
            }]
        }]
    },

    // Basic HTML document structure
    BASIC_HTML: {
        tag: 'root',
        children: [{
            tag: 'html',
            children: [
                {
                    tag: 'body',
                    children: [{
                        tag: 'h1',
                        children: [{
                            type: 'text',
                            value: 'Test Page'
                        }]
                    }]
                }
            ]
        }]
    }
};