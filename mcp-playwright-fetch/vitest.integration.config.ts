import { defineConfig } from 'vitest/config';

export default defineConfig({
    test: {
        globals: true,
        environment: 'node',
        include: ['tests/integration/**/*_integration_test.ts'],
        setupFiles: ['./vitest.setup.ts'],
        mockReset: false,
        clearMocks: false,
        restoreMocks: false,
        testTimeout: 30000, // 30s timeout for integration tests
        env: {
            TEST_TYPE: 'integration'
        }
    },
});