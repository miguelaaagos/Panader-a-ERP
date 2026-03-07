---
description: Ejecutar pruebas de extremo a extremo (E2E) con Playwright
---

Para validar la integridad del sistema y la UI, sigue estos pasos (ejecutar SOLO cuando sea estrictamente necesario o el usuario lo solicite):

1. **Asegurar que el servidor está listo**:
   - Playwright iniciará automáticamente `npm run dev` si no está corriendo.

// turbo
2. **Ejecutar todos los tests**:
```bash
pnpm exec playwright test
```

3. **Ejecutar en modo UI (Interactivo)**:
```bash
pnpm exec playwright test --ui
```

4. **Ver reporte detallado**:
```bash
npx playwright show-report
```

> [!TIP]
> Si los tests de autenticación fallan, revisa que `TEST_USER_EMAIL` y `TEST_USER_PASSWORD` estén correctamente configurados en tu archivo `.env`.
