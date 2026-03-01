/**
 * Lógica pura para conversión de unidades
 */
export type AppUnit = "kg" | "g" | "L" | "ml" | "unidades";

export function handleUnitConversion(
    oldUnit: "kg" | "g" | "L" | "ml" | "unidades",
    newUnit: "kg" | "g" | "L" | "ml" | "unidades",
    currentStock: number,
    currentCost: number
) {
    let newStock = currentStock
    let newCost = currentCost

    if (oldUnit === newUnit) return { newStock, newCost }

    // Kg <-> G
    if (oldUnit === "kg" && newUnit === "g") {
        newStock = currentStock * 1000
        newCost = currentCost / 1000
    } else if (oldUnit === "g" && newUnit === "kg") {
        newStock = currentStock / 1000
        newCost = currentCost * 1000
    }

    // L <-> Ml
    if (oldUnit === "L" && newUnit === "ml") {
        newStock = currentStock * 1000
        newCost = currentCost / 1000
    } else if (oldUnit === "ml" && newUnit === "L") {
        newStock = currentStock / 1000
        newCost = currentCost * 1000
    }

    return { newStock, newCost }
}

/**
 * Convierte una cantidad de una unidad a otra.
 * @param value Valor a convertir
 * @param fromUnit Unidad de origen
 * @param toUnit Unidad de destino
 * @param factor Factor opcional (por defecto 1000 para kg/g y L/ml)
 */
export function convertQuantity(
    value: number | string,
    fromUnit: string,
    toUnit: string,
    factor?: number
): number {
    const numValue = typeof value === "string"
        ? parseFloat(value.replace(",", "."))
        : value;

    if (isNaN(numValue)) return 0;

    const fUnit = fromUnit.toLowerCase();
    const tUnit = toUnit.toLowerCase();

    if (fUnit === tUnit) return numValue;

    const conversionFactor = factor || 1000;

    // Masa
    if (fUnit === "kg" && tUnit === "g") return numValue * conversionFactor;
    if (fUnit === "g" && tUnit === "kg") return numValue / conversionFactor;

    // Volumen
    if (fUnit === "l" && tUnit === "ml") return numValue * conversionFactor;
    if (fUnit === "ml" && tUnit === "l") return numValue / conversionFactor;

    return numValue;
}

/**
 * Calcula el costo de una línea basado en la cantidad y unidad seleccionada.
 * 
 * Ejemplo: 12g de Harina a $9600/kg
 *   - convertQuantity(12, "g", "kg") = 0.012
 *   - 0.012 * 9600 = $115.20
 */
export function getLineCost({
    cantidad,
    unidadSeleccionada,
    unidadCompra,
    factor,
    costoCompra
}: {
    cantidad: number;
    unidadSeleccionada: string;
    unidadCompra: string;
    factor: number;
    costoCompra: number;
}): number {
    if (!cantidad || !costoCompra) return 0;

    // Normalizar a la unidad de compra usando convertQuantity
    const cantidadEnUnidadCompra = convertQuantity(
        cantidad,
        unidadSeleccionada,
        unidadCompra,
        factor || 1000
    );

    return cantidadEnUnidadCompra * costoCompra;
}
