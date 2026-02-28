import { describe, it, expect } from 'vitest';

describe('Financial Math - Costos Fijos vs Variables', () => {

    // Función pura simulada de nuestro backend (actions/reportes.ts)
    const calcularReporteFinanciero = (ventas: any[], gastos: any[]) => {
        let totalVentas = 0;
        let totalIvaDebito = 0;

        ventas.forEach(v => {
            totalVentas += v.total;
            totalIvaDebito += v.iva;
        });

        let totalGastosNeto = 0;
        let totalIvaCredito = 0;
        let totalGastosBruto = 0;

        let totalFijosBruto = 0;
        let totalFijosNeto = 0;
        let totalVariablesBruto = 0;
        let totalVariablesNeto = 0;

        gastos.forEach(g => {
            totalGastosNeto += g.monto_neto;
            totalIvaCredito += g.monto_iva;
            totalGastosBruto += g.monto_total;

            if (g.tipo_gasto === 'fijo') {
                totalFijosBruto += g.monto_total;
                totalFijosNeto += g.monto_neto;
            } else {
                totalVariablesBruto += g.monto_total;
                totalVariablesNeto += g.monto_neto;
            }
        });

        const resumen = {
            ventas: {
                bruto: totalVentas,
                neto: totalVentas - totalIvaDebito,
                iva_debito: totalIvaDebito
            },
            gastos: {
                bruto: totalGastosBruto,
                neto: totalGastosNeto,
                iva_credito: totalIvaCredito,
                fijos_bruto: totalFijosBruto,
                fijos_neto: totalFijosNeto,
                variables_bruto: totalVariablesBruto,
                variables_neto: totalVariablesNeto,
            },
            impuestos: {
                iva_a_pagar: Math.max(0, totalIvaDebito - totalIvaCredito),
                iva_a_favor: Math.max(0, totalIvaCredito - totalIvaDebito)
            },
            utilidad: {
                bruta: (totalVentas - totalIvaDebito) - totalVariablesNeto,
                neta: (totalVentas - totalIvaDebito) - totalVariablesNeto - totalFijosNeto
            }
        };

        return resumen;
    };

    it('Debe separar correctamente costos fijos y variables', () => {
        const ventas = [
            { total: 119000, iva: 19000 } // Neto: 100000
        ];

        const gastos = [
            // Sueldo (Fijo, sin IVA)
            { monto_total: 500000, monto_neto: 500000, monto_iva: 0, tipo_gasto: 'fijo' },
            // Arriendo (Fijo, sin IVA)
            { monto_total: 200000, monto_neto: 200000, monto_iva: 0, tipo_gasto: 'fijo' },
            // Harina (Variable, con IVA) -> Neto: 100000, IVA 19000
            { monto_total: 119000, monto_neto: 100000, monto_iva: 19000, tipo_gasto: 'variable' },
            // Levadura (Variable, con IVA) -> Neto: 50000, IVA 9500
            { monto_total: 59500, monto_neto: 50000, monto_iva: 9500, tipo_gasto: 'variable' },
        ];

        const reporte = calcularReporteFinanciero(ventas, gastos);

        // Validaciones Gastos Fijos
        expect(reporte.gastos.fijos_bruto).toBe(700000); // 500000 + 200000
        expect(reporte.gastos.fijos_neto).toBe(700000);

        // Validaciones Gastos Variables
        expect(reporte.gastos.variables_bruto).toBe(119000 + 59500); // 178500
        expect(reporte.gastos.variables_neto).toBe(100000 + 50000); // 150000

        // Utilidad
        // Bruta = Ventas Netas (100.000) - Gastos Variables Netos (150.000) = -50.000
        expect(reporte.utilidad.bruta).toBe(-50000);
        // Neta = Utilidad Bruta (-50.000) - Gastos Fijos (700.000) = -750.000
        expect(reporte.utilidad.neta).toBe(-750000);
    });

    it('Debe calcular impuestos a favor y en contra de forma exacta', () => {
        const ventas = [
            // Venatas Bruto: 1,190,000 | Neto: 1,000,000 | Iva Debito: 190,000
            { total: 1190000, iva: 190000 }
        ];

        // Escenario 1: IVA Crédito mayor que IVA débito (Compras > Ventas en términos de IVA)
        const gastosAltoIva = [
            { monto_total: 2380000, monto_neto: 2000000, monto_iva: 380000, tipo_gasto: 'variable' }
        ];

        let reporte = calcularReporteFinanciero(ventas, gastosAltoIva);
        expect(reporte.impuestos.iva_a_pagar).toBe(0);
        expect(reporte.impuestos.iva_a_favor).toBe(190000); // 380k credito - 190k debito

        // Escenario 2: IVA Débito mayor que IVA crédito (Ventas > Compras en términos de IVA)
        const gastosBajoIva = [
            { monto_total: 119000, monto_neto: 100000, monto_iva: 19000, tipo_gasto: 'variable' }
        ];

        reporte = calcularReporteFinanciero(ventas, gastosBajoIva);
        expect(reporte.impuestos.iva_a_pagar).toBe(171000); // 190k debito - 19k credito
        expect(reporte.impuestos.iva_a_favor).toBe(0);
    });

    it('Debe manejar arreglos vacíos sin retornar NaN', () => {
        const reporte = calcularReporteFinanciero([], []);

        expect(reporte.utilidad.bruta).toBe(0);
        expect(reporte.utilidad.neta).toBe(0);
        expect(reporte.impuestos.iva_a_pagar).toBe(0);
        expect(reporte.impuestos.iva_a_favor).toBe(0);
        expect(reporte.gastos.fijos_neto).toBe(0);
        expect(reporte.gastos.variables_neto).toBe(0);
    });
});
