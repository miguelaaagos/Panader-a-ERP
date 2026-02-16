/**
 * Lógica pura para conversión de unidades
 */
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
