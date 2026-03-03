import { defineConfig, devices } from '@playwright/test';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '.env.test') });
dotenv.config({ path: path.resolve(__dirname, '.env') });

/**
 * Estrategia de testing:
 * - LOCAL: solo Chromium. Rápido, para verificar flujos críticos antes de push.
 * - CI: multi-browser (Chromium + Firefox + Mobile). Se activa con CI=true.
 *
 * Cuándo escribir tests Playwright:
 * ✅ Auth (login → sesión → logout)
 * ✅ Checkout POS (carrito → cobro → descuento de stock)
 * ✅ Cualquier flujo que mueva dinero o inventario
 *
 * ❌ NO usar Playwright para:
 * ❌ Cambios de UI, estilos, colores
 * ❌ Navegación simple sin mutations
 * ❌ Features en desarrollo activo → testeo manual primero
 */
export default defineConfig({
    testDir: './tests',
    testMatch: '**/*.{e2e,spec}.ts',
    fullyParallel: true,
    forbidOnly: !!process.env.CI,
    retries: process.env.CI ? 2 : 0,
    workers: process.env.CI ? 1 : 1,
    reporter: process.env.CI ? 'html' : 'list',

    use: {
        baseURL: 'http://localhost:3000',
        trace: 'on-first-retry',
        testIdAttribute: 'data-testid',
    },

    projects: [
        // Setup de auth — siempre corre primero
        {
            name: 'setup',
            testMatch: /auth\.setup\.ts/,
        },

        // LOCAL y CI: Chromium desktop (el principal)
        {
            name: 'chromium',
            use: {
                ...devices['Desktop Chrome'],
                storageState: 'playwright/.auth/user.json',
            },
            dependencies: ['setup'],
        },

        // Solo CI: Firefox y Mobile
        ...(process.env.CI ? [
            {
                name: 'firefox',
                use: {
                    ...devices['Desktop Firefox'],
                    storageState: 'playwright/.auth/user.json',
                },
                dependencies: ['setup'],
            },
            {
                name: 'Mobile Chrome',
                use: {
                    ...devices['Pixel 5'],
                    storageState: 'playwright/.auth/user.json',
                },
                dependencies: ['setup'],
            },
        ] : []),
    ],

    webServer: {
        command: 'pnpm dev',
        url: 'http://localhost:3000',
        reuseExistingServer: !process.env.CI,
        stdout: 'pipe',
        stderr: 'pipe',
    },
});
