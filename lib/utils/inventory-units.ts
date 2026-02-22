export type AppUnit = "kg" | "g" | "L" | "ml" | "unidades";

/**
 * Convierte una cantidad ingresada en una unidad específica a la unidad base del producto.
 * Ejemplo: Si la unidad base es "kg" y el usuario ingresa 500 "g", retorna 0.5
 */
export function convertToDisplayUnit(
    amount: number,
    fromUnit: AppUnit,
    toUnit: AppUnit
): number {
    if (fromUnit === toUnit) return amount;

    // Conversiones de masa
    if (fromUnit === "g" && toUnit === "kg") return amount / 1000;
    if (fromUnit === "kg" && toUnit === "g") return amount * 1000;

    // Conversiones de volumen
    if (fromUnit === "ml" && toUnit === "L") return amount / 1000;
    if (fromUnit === "L" && toUnit === "ml") return amount * 1000;

    // Si las unidades no son compatibles (ej. unidades a kg), 
    // o no hay conversión, retornar la cantidad original (o lanzar error según negocio).
    return amount;
}

/**
 * Calcula el costo unitario en la unidad base del producto.
 * Si compré 500g a $1000, y mi base es KG, entonces el costo unitario por KG es $2000.
 */
export function calculateBaseCost(
    totalCostEntered: number,
    amountEntered: number,
    enteredUnit: AppUnit,
    baseUnit: AppUnit
): number {
    if (amountEntered <= 0) return 0;

    // 1. Encontrar cuánta cantidad base representa lo ingresado
    const baseAmount = convertToDisplayUnit(amountEntered, enteredUnit, baseUnit);

    // 2. Si 0.5kg costaron 1000, entonces 1kg cuesta 1000 / 0.5 = 2000
    // Evitamos división por ceros
    if (baseAmount === 0) return 0;

    return totalCostEntered / baseAmount;
}
