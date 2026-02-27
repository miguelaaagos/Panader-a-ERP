"use client"

import { useRouter, useSearchParams } from "next/navigation"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

export function DashboardFilter() {
    const router = useRouter()
    const searchParams = useSearchParams()

    const currentMonth = searchParams.get("month") || "all"
    const currentYear = searchParams.get("year") || "all"

    const years = ["2024", "2025", "2026"]
    const months = [
        { value: "all", label: "Todos los meses" },
        { value: "01", label: "Enero" },
        { value: "02", label: "Febrero" },
        { value: "03", label: "Marzo" },
        { value: "04", label: "Abril" },
        { value: "05", label: "Mayo" },
        { value: "06", label: "Junio" },
        { value: "07", label: "Julio" },
        { value: "08", label: "Agosto" },
        { value: "09", label: "Septiembre" },
        { value: "10", label: "Octubre" },
        { value: "11", label: "Noviembre" },
        { value: "12", label: "Diciembre" },
    ]

    const handleYearChange = (year: string) => {
        const params = new URLSearchParams(searchParams.toString())
        if (year === "all") {
            params.delete("year")
            params.delete("month")
        } else {
            params.set("year", year)
        }
        router.push(`?${params.toString()}`)
    }

    const handleMonthChange = (month: string) => {
        const params = new URLSearchParams(searchParams.toString())
        if (month === "all") {
            params.delete("month")
        } else {
            params.set("month", month)
            // Si selecciona mes pero no hay año, ponemos el actual por defecto
            if (!params.has("year") || params.get("year") === "all") {
                params.set("year", new Date().getFullYear().toString())
            }
        }
        router.push(`?${params.toString()}`)
    }

    return (
        <div className="flex gap-2">
            <Select value={currentYear} onValueChange={handleYearChange}>
                <SelectTrigger className="w-[125px] bg-background font-bold">
                    <SelectValue placeholder="Año" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="all">Año Actual</SelectItem>
                    {years.map(y => (
                        <SelectItem key={y} value={y}>{y}</SelectItem>
                    ))}
                </SelectContent>
            </Select>

            <Select
                value={currentMonth}
                onValueChange={handleMonthChange}
            >
                <SelectTrigger className="w-[160px] bg-background font-bold">
                    <SelectValue placeholder="Mes" />
                </SelectTrigger>
                <SelectContent>
                    {months.map(m => (
                        <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>
                    ))}
                </SelectContent>
            </Select>
        </div>
    )
}
