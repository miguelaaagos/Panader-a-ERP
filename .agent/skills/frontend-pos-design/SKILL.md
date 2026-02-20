---
name: frontend-pos-design
description: Frontend and UI/UX design standards for the POS Panadería Project. Enforces responsive design, dark mode compatibility, toaster notifications, and accessible charts.
---
# Frontend & UI/UX Design Standards (POS Panadería)

Cuando desarrolles nuevas interfaces o componentes para el proyecto, DEBES seguir estrictamente estas reglas de diseño. El sistema debe sentirse moderno, premium y ser 100% funcional tanto en pantallas grandes horizontales (Dashboard/Caja) como en móviles verticales.

## 1. Notificaciones y Feedback (Toaster)
- **Regla:** Toda acción de mutación de datos (crear, editar, eliminar) DEBE tener feedback visual.
- **Implementación:** Usa `toast` (de `sonner` o del componente ui) en los Server Actions o después de peticiones.
- **Ejemplo:** `toast.success('Producto creado correctamente')` o `toast.error('Error al actualizar el stock')`.

## 2. Responsividad y Grillas (Mobile-First adaptativo)
- **Regla:** Todo debe ser usable en el celular del dueño o en la tablet de la caja.
- **Grillas:** Usa `grid-cols-1` por defecto y `md:grid-cols-2` o `lg:grid-cols-3/4` para pantallas grandes. Nunca asumas que el usuario tiene una pantalla ancha.
- **Navegación:** El sidebar debe ser colapsable en pantallas pequeñas, transformándose en un menú hamburguesa (componente `Sheet` de shadcn).

## 3. Tablas de Datos Dinámicas
- **Regla:** Las tablas no deben desbordar la pantalla en móviles.
- **Implementación:** Oculta columnas secundarias en pantallas pequeñas usando clases como `hidden md:table-cell`. Muestra solo lo crítico (ej. Nombre, Estado, Total) en móviles. Considera usar vistas de tarjetas para datos muy complejos en móvil si la tabla no es suficiente.

## 4. Gráficos y Visualización de Datos (Recharts)
- **Regla:** Los gráficos deben ser fáciles de leer a simple vista (como PowerBI).
- **Etiquetas:** Usa `<LabelList>` en los componentes `<Bar>` o `<Line>` para mostrar los valores directamente sobre o junto a los elementos. No dependas exclusivamente del `Tooltip` (hover), ya que en táctil es incómodo.
- **Responsividad:** Envuelve siempre los gráficos en `<ResponsiveContainer width="100%" height={300}>`.
- **Colores:** Mantén coherencia de colores. Si muestras un Top 5, usa degradados del color primario (más opaco al más transparente) de forma consistente en todos los gráficos relacionados.

## 5. Tema Oscuro (Dark Mode)
- **Regla:** El contraste debe ser perfecto tanto en Light como en Dark mode.
- **Colores:** NUNCA uses colores absolutos (ej. `bg-white`, `text-black`) para elementos de estructura. Usa las variables CSS del tema (ej. `bg-background`, `text-foreground`, `bg-muted`, `border-border`, `bg-card`).
- **Excepciones:** Solo usa colores estáticos para elementos de marca específicos o estados (ej. `text-red-500` para errores, pero verificando que se lea bien en oscuro).

## 6. Estados de Carga y Vacíos
- **Regla:** Nunca dejes la pantalla en blanco mientras se cargan los datos.
- **Esqueletos:** Usa `<Skeleton />` de shadcn para replicar la forma de la UI mientras carga (especialmente en Dashboards y POS).
- **Empty States:** Si no hay datos (ej. "No hay ventas hoy"), muestra un mensaje amigable, centrado, idealmente con un ícono suave (`text-muted-foreground`).
