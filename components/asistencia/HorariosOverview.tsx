"use client";

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface Schedule {
    dia_semana: number;
    hora_entrada: string;
    hora_salida: string;
    usuarios: {
        id: string;
        nombre_completo: string;
        rol: string;
    };
}

interface Props {
    schedules: Schedule[];
}

const DIAS = ["", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado", "Domingo"];

export function HorariosOverview({ schedules }: Props) {
    // Agrupar por usuario
    const grouped = schedules.reduce((acc, curr) => {
        const userId = curr.usuarios.id;
        if (!acc[userId]) {
            acc[userId] = {
                nombre: curr.usuarios.nombre_completo,
                rol: curr.usuarios.rol,
                dias: {} as Record<number, string>
            };
        }
        acc[userId].dias[curr.dia_semana] = `${curr.hora_entrada.substring(0, 5)} - ${curr.hora_salida.substring(0, 5)}`;
        return acc;
    }, {} as Record<string, { nombre: string, rol: string, dias: Record<number, string> }>);

    const users = Object.values(grouped);

    return (
        <Card className="border-none shadow-none bg-transparent">
            <CardHeader className="px-0">
                <CardTitle className="text-xl">Vista General de Horarios Especiales</CardTitle>
                <CardDescription>
                    Resumen de los días y horas asignados específicamente a cada empleado.
                </CardDescription>
            </CardHeader>
            <CardContent className="px-0">
                <div className="rounded-xl border bg-card/50 backdrop-blur-sm overflow-hidden">
                    <Table>
                        <TableHeader className="bg-muted/50">
                            <TableRow>
                                <TableHead className="w-[200px] font-bold">Empleado</TableHead>
                                {[1, 2, 3, 4, 5, 6, 7].map(d => (
                                    <TableHead key={d} className="text-center font-bold">
                                        {(DIAS[d] || "").substring(0, 3)}
                                    </TableHead>
                                ))}
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {users.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={8} className="text-center h-32 text-muted-foreground italic">
                                        No se han definido horarios especiales para ningún empleado.
                                    </TableCell>
                                </TableRow>
                            ) : (
                                users.map((u, i) => (
                                    <TableRow key={i} className="hover:bg-muted/30 transition-colors">
                                        <TableCell>
                                            <div className="flex flex-col">
                                                <span className="font-semibold text-sm">{u.nombre}</span>
                                                <span className="text-[10px] uppercase text-muted-foreground tracking-wider">{u.rol}</span>
                                            </div>
                                        </TableCell>
                                        {[1, 2, 3, 4, 5, 6, 7].map(d => (
                                            <TableCell key={d} className="text-center">
                                                {u.dias?.[d] ? (
                                                    <Badge variant="outline" className="text-[10px] font-mono bg-emerald-500/5 text-emerald-600 dark:text-emerald-400 border-emerald-500/20 px-1.5 py-0">
                                                        {u.dias[d]}
                                                    </Badge>
                                                ) : (
                                                    <span className="text-xs text-muted-foreground/40">—</span>
                                                )}
                                            </TableCell>
                                        ))}
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </div>
            </CardContent>
        </Card>
    );
}
