"use client";

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AsistenciaRow } from "./types";
import { TrendingUp, Clock } from "lucide-react";

interface Props {
    asistencias: AsistenciaRow[];
}

export function HorasExtrasSummary({ asistencias }: Props) {
    // Agrupar y sumar horas extras por usuario
    const summary = asistencias.reduce((acc, curr) => {
        const userId = curr.usuario_id;
        const asis = curr as any;
        const horasExtra = asis.horas_extra || 0;

        if (!acc[userId]) {
            acc[userId] = {
                nombre: curr.usuarios?.nombre_completo || "Desconocido",
                rol: curr.usuarios?.rol || "-",
                totalExtras: 0,
                count: 0
            };
        }

        acc[userId].totalExtras += horasExtra;
        if (horasExtra > 0) acc[userId].count += 1;

        return acc;
    }, {} as Record<string, { nombre: string, rol: string, totalExtras: number, count: number }>);

    const data = (Object.values(summary) as Array<{ nombre: string, rol: string, totalExtras: number, count: number }>)
        .sort((a, b) => b.totalExtras - a.totalExtras);
    const globalTotal = data.reduce((sum, item) => sum + item.totalExtras, 0);

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card className="bg-amber-500/10 border-amber-500/20">
                    <CardHeader className="pb-2">
                        <CardDescription className="text-amber-600 dark:text-amber-400 font-semibold uppercase text-[10px] tracking-widest">Total Horas Extras (Mes)</CardDescription>
                        <CardTitle className="text-3xl font-bold flex items-center justify-between">
                            {globalTotal.toFixed(1)}h
                            <Clock className="h-6 w-6 text-amber-500" />
                        </CardTitle>
                    </CardHeader>
                </Card>
                <Card className="bg-emerald-500/10 border-emerald-500/20">
                    <CardHeader className="pb-2">
                        <CardDescription className="text-emerald-600 dark:text-emerald-400 font-semibold uppercase text-[10px] tracking-widest">Empleados con Extras</CardDescription>
                        <CardTitle className="text-3xl font-bold flex items-center justify-between">
                            {data.filter(d => d.totalExtras > 0).length}
                            <TrendingUp className="h-6 w-6 text-emerald-500" />
                        </CardTitle>
                    </CardHeader>
                </Card>
            </div>

            <Card className="border-none shadow-none bg-transparent">
                <CardHeader className="px-0">
                    <CardTitle className="text-xl">Resumen Detallado de Horas Extras</CardTitle>
                    <CardDescription>
                        Acumulado de horas adicionales trabajadas por cada empleado en el periodo actual.
                    </CardDescription>
                </CardHeader>
                <CardContent className="px-0">
                    <div className="rounded-xl border bg-card/50 backdrop-blur-sm overflow-hidden">
                        <Table>
                            <TableHeader className="bg-muted/50">
                                <TableRow>
                                    <TableHead className="font-bold">Empleado</TableHead>
                                    <TableHead className="text-center font-bold">Días con Extras</TableHead>
                                    <TableHead className="text-right font-bold w-[150px]">Total Acumulado</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {data.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={3} className="text-center h-32 text-muted-foreground italic">
                                            No se han registrado horas extras en este periodo.
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    data.map((u, i) => (
                                        <TableRow key={i} className="hover:bg-muted/30 transition-colors">
                                            <TableCell>
                                                <div className="flex flex-col">
                                                    <span className="font-semibold text-sm">{u.nombre}</span>
                                                    <span className="text-[10px] uppercase text-muted-foreground tracking-wider">{u.rol}</span>
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-center">
                                                <Badge variant="secondary" className="font-bold">
                                                    {u.count} días
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <span className={`text-lg font-bold ${u.totalExtras > 0 ? 'text-amber-600 dark:text-amber-400' : 'text-muted-foreground'}`}>
                                                    {u.totalExtras.toFixed(2)}h
                                                </span>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
