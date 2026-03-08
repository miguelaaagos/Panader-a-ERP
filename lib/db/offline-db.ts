import Dexie, { type Table } from 'dexie';

export interface OfflineProduct {
    id: string;
    nombre: string;
    codigo: string | null;
    precio_venta: number;
    es_pesable: boolean;
    stock_actual: number;
    categoria_id?: string;
    tenant_id: string;
}

export interface OfflineSaleItem {
    id: string;
    nombre: string;
    precio_venta: number;
    cantidad: number;
    subtotal: number;
}

export interface OfflineSale {
    id?: number;
    data: any; // El payload de createSale
    fecha: string;
    tenant_id?: string;
    synced: 0 | 1;
}

export class OfflineDatabase extends Dexie {
    productos!: Table<OfflineProduct>;
    ventas_pendientes!: Table<OfflineSale>;

    constructor() {
        super('PanaderiaOfflineDB');
        this.version(1).stores({
            productos: 'id, codigo, tenant_id',
            ventas_pendientes: '++id, tenant_id, synced, fecha'
        });
    }
}

export const db = new OfflineDatabase();
