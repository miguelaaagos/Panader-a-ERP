---
name: playwright-testing
description: Mejores prácticas para testeo E2E y de componentes con Playwright en Next.js 16 y Supabase.
version: 1.0.0
tags: [playwright, testing, e2e, supabase, nextjs]
---

# Playwright Testing Skill

## 🚀 Principios Fundamentales

1. **Web-First Assertions**: Usa `expect(locator).toBeVisible()` en lugar de esperar manualmente.
2. **Locators Estables**: Prioriza `page.getByTestId('...')`. Si no existe, agrégalo al código fuente.
3. **Aislamiento**: Cada test debe ser independiente. Usa `test.beforeEach` para preparar el estado.

## 🔐 Manejo de Autenticación (Supabase)

Para evitar loguearse en cada test:

1. **Setup Global**:
```typescript
// tests/auth.setup.ts
import { test as setup } from '@playwright/test';

const authFile = 'playwright/.auth/user.json';

setup('authenticate', async ({ page }) => {
  await page.goto('/login');
  await page.getByLabel('Email').fill(process.env.TEST_USER_EMAIL!);
  await page.getByLabel('Password').fill(process.env.TEST_USER_PASSWORD!);
  await page.getByRole('button', { name: 'Log in' }).click();
  await page.waitForURL('/dashboard');
  await page.context().storageState({ path: authFile });
});
```

2. **Uso en Tests**:
```typescript
test.use({ storageState: 'playwright/.auth/user.json' });

test('panel de ventas accesible', async ({ page }) => {
  await page.goto('/pos');
  await expect(page.getByTestId('pos-container')).toBeVisible();
});
```

## 🧪 Testing de Next.js 16

### Server Actions
Verifica que los cambios en el servidor se reflejen en la UI sin recargar:
```typescript
await page.getByTestId('save-button').click();
await expect(page.locator('text=Cambios guardados')).toBeVisible(); // Notificación Toast
```

### Mobile First
Configura proyectos en `playwright.config.ts` para validar la responsividad del menú Hamburguesa:
```typescript
projects: [
  {
    name: 'Mobile Safari',
    use: { ...devices['iPhone 13'] },
  },
]
```

## 🛠 Comandos Útiles

- `pnpm exec playwright test`: Ejecuta todos los tests.
- `pnpm exec playwright test --ui`: Abre la interfaz interactiva.
- `npx playwright codegen`: Graba interacciones y genera código.
