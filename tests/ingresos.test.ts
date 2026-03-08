import { describe, it, expect } from 'vitest';
import { convertToDisplayUnit, calculateBaseCost } from '../lib/utils/inventory-units';

describe('Inventory Units Math', () => {

    describe('convertToDisplayUnit', () => {
        it('should correctly convert grams to kilos', () => {
            expect(convertToDisplayUnit(500, "g", "kg")).toBe(0.5);
            expect(convertToDisplayUnit(1500, "g", "kg")).toBe(1.5);
        });

        it('should correctly convert kilos to grams', () => {
            expect(convertToDisplayUnit(1.5, "kg", "g")).toBe(1500);
            expect(convertToDisplayUnit(0.1, "kg", "g")).toBe(100);
        });

        it('should correctly convert ml to L', () => {
            expect(convertToDisplayUnit(200, "ml", "L")).toBe(0.2);
            expect(convertToDisplayUnit(2500, "ml", "L")).toBe(2.5);
        });

        it('should not convert if units are the same', () => {
            expect(convertToDisplayUnit(10, "unidades", "unidades")).toBe(10);
            expect(convertToDisplayUnit(5, "kg", "kg")).toBe(5);
        });
    });

    describe('calculateBaseCost', () => {
        it('should calculate the base cost when purchasing in grams but storing in kg', () => {
            // Ejemplo: Compramos 500g a $1000. La unidad base es kg. 
            // Esperamos que el costo unitario por kilo sea $2000.
            const cost = calculateBaseCost(1000, 500, "g", "kg");
            expect(cost).toBe(2000);
        });

        it('should calculate the base cost when purchasing in kg but storing in grams', () => {
            // Ejemplo: Compramos 2kg (2000g) a $4000. La base es g.
            // Esperamos que el costo unitario por gramo sea $2.
            const cost = calculateBaseCost(4000, 2, "kg", "g");
            expect(cost).toBe(2);
        });

        it('should handle same units correctly', () => {
            // Compramos 10 unidades por $500 total.
            // Costo por unidad debe ser $50.
            const cost = calculateBaseCost(500, 10, "unidades", "unidades");
            expect(cost).toBe(50);
        });

        it('should return 0 when total cost is 0', () => {
            const cost = calculateBaseCost(0, 10, "kg", "kg");
            expect(cost).toBe(0);
        });

        it('should return 0 when amount is 0 or negative', () => {
            const cost = calculateBaseCost(1000, 0, "kg", "kg");
            expect(cost).toBe(0);

            const costNegative = calculateBaseCost(1000, -5, "kg", "kg");
            expect(costNegative).toBe(0);
        });
    });
});
