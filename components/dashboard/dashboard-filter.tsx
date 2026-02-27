"use client"

import { useRouter, useSearchParams } from "next/navigation"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { subMonths, format, startOfMonth } from "date-fns"
import { es } from "date-fns/locale"

export function DashboardFilter() {
    const router = useRouter()
    const searchParams = useSearchParams()

    const currentMonth = searchParams.get("month") || undefined
    const currentYear = searchParams.get("year") || undefined

    const monthsList = Array.from({ length: 12 }).map((_, i) => {
        const d = subMonths(startOfMonth(new Date()), i)
        return {
            value: `${format(d, "MM")}-${format(d, "yyyy")}`,
            label: format(d, "MMMM yyyy", { locale: es }).replace(/^\w/, c => c.toUpperCase())
        }
    })

    const defaultValue = currentMonth && currentYear
        ? `${currentMonth.padStart(2, '0')}-${currentYear}`
        : monthsList[0]?.value || ""

    const handleValueChange = (val: string) => {
        const [m, y] = val.split("-")
        const params = new URLSearchParams(searchParams.toString())

        const isCurrent = val === monthsList[0]?.value

        if (isCurrent) {
            params.delete("month")
            params.delete("year")
        } else {
            if (m) params.set("month", m)
            if (y) params.set("year", y)
        }

        router.push(`?${params.toString()}`)
    }

    return (
        <Select value={defaultValue} onValueChange={handleValueChange}>
            <SelectTrigger className="w-[180px] bg-background">
                <SelectValue placeholder="Seleccionar mes" />
            </SelectTrigger>
            <SelectContent>
                {monthsList.map(m => (
                    <SelectItem key={m.value} value={m.value}>
                        {m.label}
                    </SelectItem>
                ))}
            </SelectContent>
        </Select>
    )
}
