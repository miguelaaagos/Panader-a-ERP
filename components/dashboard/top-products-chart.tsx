import { useState } from "react"
import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip, Cell, LabelList } from "recharts"
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ChevronLeft, ChevronRight } from "lucide-react"

interface TopProductItem {
    nombre: string
    total: number
}

interface TopProductsChartProps {
    data: TopProductItem[]
}

const COLORS = [
    'hsl(var(--primary))',
    'hsl(var(--primary)/0.8)',
    'hsl(var(--primary)/0.6)',
    'hsl(var(--primary)/0.4)',
    'hsl(var(--primary)/0.2)'
]

const ITEMS_PER_PAGE = 5

export function TopProductsChart({ data }: TopProductsChartProps) {
    const [currentPage, setCurrentPage] = useState(0)

    const totalPages = Math.ceil(data.length / ITEMS_PER_PAGE)
    const paginatedData = data.slice(currentPage * ITEMS_PER_PAGE, (currentPage + 1) * ITEMS_PER_PAGE)

    return (
        <Card className="flex flex-col h-full">
            <CardHeader className="pb-2">
                <CardTitle className="text-xl">Top Productos</CardTitle>
                <CardDescription>Por volumen de ventas CLP.</CardDescription>
            </CardHeader>
            <CardContent className="flex-1 pb-2 pl-2">
                <div className="h-[300px] w-full min-w-0">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={paginatedData} layout="vertical" margin={{ top: 5, right: 60, left: 10, bottom: 5 }}>
                            <XAxis type="number" hide />
                            <YAxis
                                dataKey="nombre"
                                type="category"
                                fontSize={11}
                                tickLine={false}
                                axisLine={false}
                                width={110}
                                tick={{ fill: 'hsl(var(--foreground))' }}
                            />
                            <Tooltip
                                cursor={{ fill: 'transparent' }}
                                contentStyle={{
                                    backgroundColor: "hsl(var(--background))",
                                    border: "1px solid hsl(var(--border))",
                                    borderRadius: "8px",
                                    fontSize: "12px"
                                }}
                                formatter={(value: any) => [new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP' }).format(Number(value || 0)), "Total"]}
                            />
                            <Bar dataKey="total" radius={[0, 4, 4, 0]}>
                                <LabelList
                                    dataKey="total"
                                    position="right"
                                    fill="hsl(var(--foreground))"
                                    fontSize={10}
                                    formatter={(value: any) => Number(value) > 0 ? new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP', maximumFractionDigits: 0 }).format(Number(value)) : ''}
                                />
                                {paginatedData.map((entry, index) => (
                                    <Cell key={`cell-${entry.nombre}`} fill={COLORS[index % COLORS.length]} />
                                ))}
                            </Bar>
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </CardContent>
            {totalPages > 1 && (
                <CardFooter className="flex items-center justify-between pt-0 pb-4 border-t px-6 mt-auto">
                    <div className="text-xs text-muted-foreground">
                        Página {currentPage + 1} de {totalPages} ({data.length} total)
                    </div>
                    <div className="flex gap-2">
                        <Button
                            variant="outline"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => setCurrentPage(p => Math.max(0, p - 1))}
                            disabled={currentPage === 0}
                        >
                            <ChevronLeft className="h-4 w-4" />
                        </Button>
                        <Button
                            variant="outline"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => setCurrentPage(p => Math.min(totalPages - 1, p + 1))}
                            disabled={currentPage === totalPages - 1}
                        >
                            <ChevronRight className="h-4 w-4" />
                        </Button>
                    </div>
                </CardFooter>
            )}
        </Card>
    )
}
