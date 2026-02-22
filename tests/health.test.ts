import { test, expect } from '@playwright/test';

test.describe('Health Check', () => {
    test('debe cargar el dashboard correctamente', async ({ page }) => {
        await page.goto('/dashboard');

        // Verificar que el título o algún elemento clave esté presente
        // Usamos un locale flexible o data-testid si ya lo tenemos
        await expect(page).toHaveURL(/.*dashboard/);

        // Si tienes un sidebar o header común:
        // await expect(page.getByRole('navigation')).toBeVisible();
    });

    test('debe ser responsivo en móvil', async ({ page, isMobile }) => {
        await page.goto('/dashboard');

        if (isMobile) {
            // Verificar que el menú hamburguesa esté presente
            await expect(page.getByRole('button', { name: /menu|abrir/i })).toBeVisible();
        }
    });
});
