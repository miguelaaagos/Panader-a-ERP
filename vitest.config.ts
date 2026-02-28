import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
    plugins: [react()],
    test: {
        environment: 'jsdom',
        globals: true,
        include: ['tests/**/*.test.{ts,tsx}'],
        exclude: ['**/node_modules/**', '**/dist/**', '**/playwright/**', '**/*.spec.ts', 'tests/health.test.ts', 'tests/ingresos.test.ts'], // Ignorar tests de Playwright
        // setupFiles: ['./tests/setup.ts'],
        alias: {
            '@': path.resolve(__dirname, './'),
        },
    },
})
