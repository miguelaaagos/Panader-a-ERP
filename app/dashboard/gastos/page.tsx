import { getGastos } from "@/actions/gastos"
import { GastosClient } from "./gastos-client"

export const metadata = {
    title: "Gastos Operativos - Panadería ERP",
}

interface PageProps {
    searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}

export default async function GastosPage({ searchParams }: PageProps) {
    const params = await searchParams

    // Si no hay parámetros, usamos el mes/año actual
    const today = new Date()
    const mes = typeof params.mes === 'string' ? parseInt(params.mes) : today.getMonth()
    const anio = typeof params.anio === 'string' ? parseInt(params.anio) : today.getFullYear()

    const res = await getGastos(mes, anio)
    const initialGastos = res.success ? (res.data || []) : []

    return (
        <GastosClient
            initialGastos={initialGastos as any}
            mes={mes}
            anio={anio}
        />
    )
}
