/// <reference types="vitest" />
import { defineConfig } from 'vitest/config';

export default defineConfig({
    test: {
        dir: 'tests/unit',
        globals: true,
        environment: 'node',
        setupFiles: ['./vitest.setup.ts']
    }
});