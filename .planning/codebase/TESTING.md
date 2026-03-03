# Testing Strategy

**Updated:** 2026-03-03

## Filosofía: velocidad de desarrollo > cobertura total

El proyecto prioriza **velocidad de desarrollo**. El testing manual es válido y preferido para la mayoría de los cambios. Playwright se reserva para flujos que involucran dinero o stock — errores ahí tienen impacto real en el negocio.

## Framework

**E2E:**
- **Playwright** — configurado en `playwright.config.ts`
- Sesión auth persistida en `playwright/.auth/user.json`
- Atributo de test: `data-testid`

**Unit (si se necesita):**
- Vitest — para lógica de negocio matemática (cálculos de costos, totales)
- No hay setup activo; agregar solo si la lógica lo justifica

## ¿Cuándo escribir un test?

### ✅ SÍ — Playwright E2E

| Flujo | Por qué |
|---|---|
| Login → sesión → logout | Auth roto = nadie entra |
| Checkout POS completo | Mueve dinero y descuenta stock |
| Crear producción con receta | Descuenta insumos del inventario |
| Reset de contraseña | Flujo PKCE con Supabase |

### ✅ SÍ — Vitest unitario

| Lógica | Por qué |
|---|---|
| Cálculo de total con descuento | Error matemático = pérdida de dinero |
| Generación de correlativo | Debe ser único y secuencial |
| Validación de Zod schemas | Contrato de datos del negocio |

### ❌ NO — Testeo manual es suficiente

- Cambios de UI, layout, colores, dark mode
- Navegación entre páginas sin mutations
- Nuevas features durante desarrollo activo
- Refactors de componentes visuales
- Ajustes de tipografía o responsividad

## Cómo correr los tests

```bash
# Local: solo Chromium, reporter de lista (rápido)
pnpm exec playwright test --project=chromium

# Con UI del browser (debug)
pnpm exec playwright test --project=chromium --headed

# Un test específico
pnpm exec playwright test tests/auth.e2e.ts --project=chromium

# Modo UI de Playwright (interactivo)
pnpm exec playwright test --ui
```

## Estructura de tests

```
tests/
├── auth.setup.ts          # Setup de sesión (corre primero)
├── auth.e2e.ts            # Login, logout, reset password
├── pos-checkout.e2e.ts    # Flujo completo de venta POS
└── production.e2e.ts      # Crear lote de producción
```

## Convenciones

```typescript
// Usar data-testid en elementos interactivos críticos
<button data-testid="btn-checkout">Cobrar</button>
<input data-testid="input-product-qty" />

// Web-first assertions (no esperas manuales)
await expect(page.getByTestId('toast-success')).toBeVisible()

// Reutilizar sesión persistida — no loguearse en cada test
// El archivo playwright/.auth/user.json lo maneja auth.setup.ts
```

## CI/CD

En CI (`CI=true`), Playwright corre en Chromium + Firefox + Mobile Chrome.
Local solo corre Chromium para ser rápido.

---

*Testing strategy: 2026-03-03*
