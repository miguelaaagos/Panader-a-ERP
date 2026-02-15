import { SaleFormData } from "@/actions/sales"

export interface OfflineSale {
    id: string
    data: SaleFormData
    timestamp: number
    synced: boolean
    error?: string
}

const STORAGE_KEY = 'pos_offline_sales'

export function getOfflineSales(): OfflineSale[] {
    if (typeof window === 'undefined') return []
    const stored = localStorage.getItem(STORAGE_KEY)
    return stored ? JSON.parse(stored) : []
}

export function saveOfflineSale(data: SaleFormData) {
    const sales = getOfflineSales()
    const newSale: OfflineSale = {
        id: crypto.randomUUID(),
        data,
        timestamp: Date.now(),
        synced: false
    }
    sales.push(newSale)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(sales))
    return newSale
}

export function removeOfflineSale(id: string) {
    const sales = getOfflineSales().filter(s => s.id !== id)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(sales))
}

export function updateOfflineSale(id: string, updates: Partial<OfflineSale>) {
    const sales = getOfflineSales().map(s =>
        s.id === id ? { ...s, ...updates } : s
    )
    localStorage.setItem(STORAGE_KEY, JSON.stringify(sales))
}

export function clearSyncedSales() {
    const sales = getOfflineSales().filter(s => !s.synced)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(sales))
}
