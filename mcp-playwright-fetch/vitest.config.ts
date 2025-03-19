import { defineConfig } from 'vitest/config';

export default defineConfig({
    test: {
        globals: true,
        environment: 'node',
        include: ['tests/unit/**/*.test.ts'],
        setupFiles: ['./vitest.setup.ts'],
        mockReset: true,
        clearMocks: true,
        restoreMocks: true,
        env: {
            TEST_TYPE: 'unit'
        }
    },
});