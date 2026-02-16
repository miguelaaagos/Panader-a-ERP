import { describe, it, expect } from 'vitest'
import { handleUnitConversion } from '@/lib/utils/units'

describe('handleUnitConversion', () => {
    it('should convert from kg to g correctly', () => {
        const { newStock, newCost } = handleUnitConversion('kg', 'g', 1, 1000)
        expect(newStock).toBe(1000)
        expect(newCost).toBe(1)
    })

    it('should convert from g to kg correctly', () => {
        const { newStock, newCost } = handleUnitConversion('g', 'kg', 1000, 1)
        expect(newStock).toBe(1)
        expect(newCost).toBe(1000)
    })

    it('should convert from L to ml correctly', () => {
        const { newStock, newCost } = handleUnitConversion('L', 'ml', 1.5, 2000)
        expect(newStock).toBe(1500)
        expect(newCost).toBe(2)
    })

    it('should convert from ml to L correctly', () => {
        const { newStock, newCost } = handleUnitConversion('ml', 'L', 500, 5)
        expect(newStock).toBe(0.5)
        expect(newCost).toBe(5000)
    })

    it('should not change values if units are the same', () => {
        const { newStock, newCost } = handleUnitConversion('kg', 'kg', 10, 500)
        expect(newStock).toBe(10)
        expect(newCost).toBe(500)
    })

    it('should not change values if units are unrelated (e.g. kg to uds)', () => {
        const { newStock, newCost } = handleUnitConversion('kg', 'unidades' as any, 10, 500)
        expect(newStock).toBe(10)
        expect(newCost).toBe(500)
    })
})
