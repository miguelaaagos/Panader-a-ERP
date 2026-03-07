"use client";

import { useState } from "react";
import { AsistenciaRow } from "./types";
import { format, differenceInMinutes } from "date-fns";
import { es } from "date-fns/locale";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Clock, Play, Square, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { marcarEntrada, marcarSalida } from "@/server/actions/attendance";

interface Props {
    activeTurn: AsistenciaRow | null;
    asistencias: AsistenciaRow[];
}

export function CashierAttendanceView({ activeTurn, asistencias }: Props) {
    const [loading, setLoading] = useState(false);

    const handleEntrada = async () => {
        setLoading(true);
        try {
            const res = await marcarEntrada();
            if (res.success) {
                toast.success("Entrada registrada con éxito.");
            } else {
                toast.error(res.error || "Hubo un error al registrar la entrada.");
            }
        } catch (err) {
            toast.error("Error inesperado en el servidor.");
        } finally {
            setLoading(false);
        }
    };

    const handleSalida = async () => {
        if (!activeTurn) return;
        setLoading(true);
        try {
            const res = await marcarSalida(activeTurn.id);
            if (res.success) {
                toast.success("Salida registrada con éxito.");
            } else {
                toast.error(res.error || "Hubo un error al registrar la salida.");
            }
        } catch (err) {
            toast.error("Error inesperado en el servidor.");
        } finally {
            setLoading(false);
        }
    };

    const calculateHours = (entrada: string, salida: string | null) => {
        if (!salida) return "En curso";
        const start = new Date(entrada);
        const end = new Date(salida);
        const minutes = differenceInMinutes(end, start);

        if (minutes < 60) return `${minutes} min`;
        const hours = Math.floor(minutes / 60);
        const remainingMins = minutes % 60;
        return `${hours}h ${remainingMins}m`;
    };

    return (
        <div className="space-y-6">
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {/* Panel de Marcación Rápida */}
                <Card className="col-span-full md:col-span-1 border-primary/20 shadow-sm">
                    <CardHeader className="text-center pb-2">
                        <CardTitle className="text-2xl font-serif">Mi Asistencia</CardTitle>
                        <CardDescription>
                            {activeTurn ? "Turno Actual en Curso" : "Actualmente Fuera de Turno"}
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="flex flex-col items-center justify-center pt-4 pb-6 gap-6">
                        <div className="flex h-32 w-32 items-center justify-center rounded-full bg-primary/10">
                            <Clock className={`h-16 w-16 ${activeTurn ? "text-amber-500 animate-pulse" : "text-primary/50"}`} />
                        </div>

                        {activeTurn && (
                            <div className="text-center space-y-1">
                                <p className="text-sm font-medium text-muted-foreground">Hora de entrada</p>
                                <p className="text-2xl font-bold font-mono">
                                    {format(new Date(activeTurn.entrada), "hh:mm a")}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                    {format(new Date(activeTurn.entrada), "dd MMMM yyyy", { locale: es })}
                                </p>
                            </div>
                        )}
                    </CardContent>
                    <CardFooter className="pt-0">
                        {!activeTurn ? (
                            <Button
                                className="w-full text-base h-12 bg-green-600 hover:bg-green-700 text-white"
                                size="lg"
                                onClick={handleEntrada}
                                disabled={loading}
                            >
                                {loading ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <Play className="mr-2 h-5 w-5 fill-current" />}
                                Marcar Entrada
                            </Button>
                        ) : (
                            <Button
                                className="w-full text-base h-12"
                                variant="destructive"
                                size="lg"
                                onClick={handleSalida}
                                disabled={loading}
                            >
                                {loading ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <Square className="mr-2 h-5 w-5 fill-current" />}
                                Marcar Salida
                            </Button>
                        )}
                    </CardFooter>
                </Card>

                {/* Historial Reciente */}
                <Card className="col-span-full md:col-span-1 lg:col-span-2">
                    <CardHeader>
                        <CardTitle>Historial Reciente</CardTitle>
                        <CardDescription>Últimos 20 turnos registrados.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="rounded-md border max-h-[400px] overflow-auto">
                            <Table>
                                <TableHeader className="sticky top-0 bg-background z-10">
                                    <TableRow>
                                        <TableHead>Fecha</TableHead>
                                        <TableHead>Entrada</TableHead>
                                        <TableHead>Salida</TableHead>
                                        <TableHead>Estado</TableHead>
                                        <TableHead className="text-right">Duración</TableHead>
                                        <TableHead className="text-right">Extras</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {asistencias.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={6} className="text-center h-24 text-muted-foreground">
                                                No hay registros recientes.
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        asistencias.map((asistencia) => {
                                            const fechaEntrada = new Date(asistencia.entrada);
                                            return (
                                                <TableRow key={asistencia.id}>
                                                    <TableCell className="font-medium">
                                                        {format(fechaEntrada, "dd MMM yyyy", { locale: es })}
                                                    </TableCell>
                                                    <TableCell>{format(fechaEntrada, "hh:mm a")}</TableCell>
                                                    <TableCell>
                                                        {asistencia.salida ? (
                                                            format(new Date(asistencia.salida), "hh:mm a")
                                                        ) : (
                                                            <span className="text-amber-500 font-medium">Activo</span>
                                                        )}
                                                    </TableCell>
                                                    <TableCell>
                                                        {asistencia.estado === "Atraso" || asistencia.estado === "Incompleto" || asistencia.estado === "Atraso e Incompleto" ? (
                                                            <span className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300">
                                                                {asistencia.estado}
                                                            </span>
                                                        ) : asistencia.estado === "En hora" ? (
                                                            <span className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300">
                                                                {asistencia.estado}
                                                            </span>
                                                        ) : (
                                                            <span className="text-muted-foreground text-xs">-</span>
                                                        )}
                                                    </TableCell>
                                                    <TableCell className="text-right">
                                                        {calculateHours(asistencia.entrada, asistencia.salida)}
                                                    </TableCell>
                                                    <TableCell className="text-right font-medium text-amber-600 dark:text-amber-500">
                                                        {asistencia.horas_extra && asistencia.horas_extra > 0 ? `${asistencia.horas_extra}h` : '-'}
                                                    </TableCell>
                                                </TableRow>
                                            );
                                        })
                                    )}
                                </TableBody>
                            </Table>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
