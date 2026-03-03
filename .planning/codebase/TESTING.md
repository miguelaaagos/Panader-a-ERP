# Testing Strategy

**Updated:** 2026-03-03

## Filosofía: velocidad de desarrollo > cobertura total

El proyecto prioriza **velocidad de desarrollo**. El testing manual es válido y preferido para la mayoría de los cambios. Playwright se reserva para flujos que involucran dinero o stock — errores ahí tienen impacto real en el negocio.

## Frameworks

**Unit — Vitest** (`vitest.config.ts`, env jsdom, globals: true)
- `pnpm test` → corre todos los unit tests
- Archivos: `tests/*.test.ts`, `lib/**/__tests__/*.test.ts`
- Tests activos: `financial.test.ts`, `erp-store.test.ts`, `unit-conversions.test.ts`
- Excluidos del runner: `health.test.ts`, `ingresos.test.ts`, archivos `.spec.ts`
- Mock de `sonner` para toast en tests de store

**E2E — Playwright** (`playwright.config.ts`)
- `pnpm exec playwright test --project=chromium`
- Sesión auth persistida en `playwright/.auth/user.json`
- Atributo de test: `data-testid`
- Local: solo Chromium; CI: Chromium + Firefox + Mobile

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

## Comandos

```bash
# Unit tests (Vitest)
pnpm test                    # todos los unit tests
pnpm test financial          # filtrar por nombre

# E2E (Playwright) — flujos críticos
pnpm exec playwright test --project=chromium
pnpm exec playwright test --project=chromium --headed   # con browser visible
pnpm exec playwright test tests/auth.e2e.ts --project=chromium
pnpm exec playwright test --ui                          # modo interactivo
```

## Estructura de tests

```
tests/
├── financial.test.ts          # Cálculos financieros (IVA, costos fijos/variables)
├── erp-store.test.ts          # Zustand ERP store (carrito, totales)
├── health.test.ts             # Ignorado en vitest (es Playwright)
├── ingresos.test.ts           # Ignorado en vitest (es Playwright)
└── (futuros .e2e.ts)          # Flujos críticos E2E

lib/utils/__tests__/
└── unit-conversions.test.ts   # Conversión kg↔g en recetas/inventario
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
