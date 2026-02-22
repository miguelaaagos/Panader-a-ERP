import { test as setup, expect } from '@playwright/test';
import path from 'path';

const authFile = path.join(__dirname, '../playwright/.auth/user.json');

setup('authenticate', async ({ page }) => {
    // Ir a la página de login
    await page.goto('/login');

    // Rellenar credenciales
    // Nota: Estas deben estar en tu .env o .env.test
    const email = process.env.TEST_USER_EMAIL;
    const password = process.env.TEST_USER_PASSWORD;

    if (!email || !password) {
        throw new Error('TEST_USER_EMAIL y TEST_USER_PASSWORD deben estar definidos en las variables de entorno');
    }

    const emailInput = page.locator('#email');
    const passwordInput = page.locator('#password');

    await emailInput.click();
    await emailInput.pressSequentially(email, { delay: 50 });

    await passwordInput.click();
    await passwordInput.pressSequentially(password, { delay: 50 });

    // Verificar que se llenaron
    await expect(emailInput).toHaveValue(email);
    await expect(passwordInput).toHaveValue(password);

    const submitBtn = page.getByRole('button', { name: /ingresar al erp/i });
    await expect(submitBtn).toBeEnabled();
    await submitBtn.click();

    // Esperar a llegar al dashboard con un timeout largo
    await page.waitForURL(/.*dashboard|.*erp/, { timeout: 20000 });

    // Guardar el estado
    await page.context().storageState({ path: authFile });
});
