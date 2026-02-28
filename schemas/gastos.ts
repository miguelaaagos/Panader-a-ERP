import { z } from "zod"

export const GastoSchema = z.object({
    descripcion: z.string().min(1, "La descripción es requerida").max(255),
    categoria_id: z.string().uuid("Categoría inválida").nullable().optional(),
    monto_neto: z.number().min(0).default(0),
    monto_iva: z.number().min(0).default(0),
    monto_total: z.number().min(0, "El monto total debe ser mayor o igual a 0"),
    tipo_documento: z.enum(["Factura", "Boleta", "Recibo", "Otro"]).default("Otro"),
    tipo_gasto: z.enum(["fijo", "variable"]).default("variable"),
    fecha_gasto: z.string() // ISO date string
})
