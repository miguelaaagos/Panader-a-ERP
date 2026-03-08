import { db, type OfflineSale } from "@/lib/db/offline-db"

export interface OfflineSaleData {
    id?: number
    data: any
    timestamp: string
    synced: number
    error?: string
}

export async function getOfflineSales() {
    return await db.ventas_pendientes.toArray()
}

export async function saveOfflineSale(data: any) {
    return await db.ventas_pendientes.add({
        data,
        fecha: new Date().toISOString(),
        synced: 0,
        tenant_id: data.tenant_id
    })
}

export async function removeOfflineSale(id: number) {
    await db.ventas_pendientes.delete(id)
}

export async function updateOfflineSale(id: number, updates: Partial<any>) {
    await db.ventas_pendientes.update(id, updates)
}

export async function clearSyncedSales() {
    await db.ventas_pendientes.where('synced').equals(1).delete()
}
