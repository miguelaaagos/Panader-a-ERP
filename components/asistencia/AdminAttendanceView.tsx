"use client";

import { AsistenciaRow } from "./types";
import { format, differenceInMinutes } from "date-fns";
import { es } from "date-fns/locale";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ConfigurarHorariosDialog } from "./ConfigurarHorariosDialog";
import { HorarioRole } from "@/server/actions/horarios";

interface Props {
    asistencias: AsistenciaRow[];
    currentMonth: number;
    currentYear: number;
    horariosActuales?: HorarioRole[];
}

const MONTHS = [
    { value: 1, label: "Enero" },
    { value: 2, label: "Febrero" },
    { value: 3, label: "Marzo" },
    { value: 4, label: "Abril" },
    { value: 5, label: "Mayo" },
    { value: 6, label: "Junio" },
    { value: 7, label: "Julio" },
    { value: 8, label: "Agosto" },
    { value: 9, label: "Septiembre" },
    { value: 10, label: "Octubre" },
    { value: 11, label: "Noviembre" },
    { value: 12, label: "Diciembre" },
];

export function AdminAttendanceView({ asistencias, currentMonth, currentYear, horariosActuales = [] }: Props) {
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();

    // Filter handlers
    const handleFilterChange = (key: "month" | "year", value: string) => {
        const params = new URLSearchParams(searchParams.toString());
        params.set(key, value);
        router.push(`${pathname}?${params.toString()}`);
    };

    // Logic for calculations
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

    // Generate an array of the last 5 years for the select
    const currentYearActual = new Date().getFullYear();
    const years = Array.from({ length: 5 }, (_, i) => currentYearActual - i);

    return (
        <div className="space-y-4">
            <Card>
                <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-4">
                    <div>
                        <CardTitle>Historial de Empleados</CardTitle>
                        <CardDescription>
                            Filtre y visualice las horas trabajadas por el personal.
                        </CardDescription>
                    </div>

                    <div className="flex gap-2">
                        <Select
                            value={currentMonth.toString()}
                            onValueChange={(val) => handleFilterChange("month", val)}
                        >
                            <SelectTrigger className="w-[140px]">
                                <SelectValue placeholder="Mes" />
                            </SelectTrigger>
                            <SelectContent>
                                {MONTHS.map(m => (
                                    <SelectItem key={m.value} value={m.value.toString()}>
                                        {m.label}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>

                        <Select
                            value={currentYear.toString()}
                            onValueChange={(val) => handleFilterChange("year", val)}
                        >
                            <SelectTrigger className="w-[110px]">
                                <SelectValue placeholder="Año" />
                            </SelectTrigger>
                            <SelectContent>
                                {years.map(y => (
                                    <SelectItem key={y} value={y.toString()}>
                                        {y}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        <Button
                            variant="outline"
                            onClick={() => router.push(pathname)}
                            title="Limpiar filtros"
                        >
                            Limpiar
                        </Button>
                        <ConfigurarHorariosDialog horariosActuales={horariosActuales} />
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="rounded-md border overflow-x-auto">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Empleado</TableHead>
                                    <TableHead>Fecha</TableHead>
                                    <TableHead>Entrada</TableHead>
                                    <TableHead>Salida</TableHead>
                                    <TableHead>Estado</TableHead>
                                    <TableHead className="text-right">Duración del Turno</TableHead>
                                    <TableHead className="text-right">Hrs. Extras</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {asistencias.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={7} className="text-center h-24 text-muted-foreground">
                                            No hay registros de asistencia en este periodo.
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    asistencias.map((asistencia) => {
                                        const fechaEntrada = new Date(asistencia.entrada);
                                        const asis = asistencia as unknown as { estado: string, horas_extra: number };

                                        return (
                                            <TableRow key={asistencia.id}>
                                                <TableCell className="font-medium">
                                                    <div className="flex flex-col">
                                                        <span>{asistencia.usuarios?.nombre_completo || "Usuario Desconocido"}</span>
                                                        <span className="text-xs text-muted-foreground hidden sm:inline-block">
                                                            {asistencia.usuarios?.email}
                                                        </span>
                                                        <span className="text-xs text-primary hidden sm:inline-block capitalize">
                                                            {asistencia.usuarios?.rol}
                                                        </span>
                                                    </div>
                                                </TableCell>
                                                <TableCell>{format(fechaEntrada, "dd MMM yyyy", { locale: es })}</TableCell>
                                                <TableCell>{format(fechaEntrada, "hh:mm a")}</TableCell>
                                                <TableCell>
                                                    {asistencia.salida ? (
                                                        format(new Date(asistencia.salida), "hh:mm a")
                                                    ) : (
                                                        <span className="text-amber-500 font-medium">Activo</span>
                                                    )}
                                                </TableCell>
                                                <TableCell>
                                                    {asis.estado === "Atraso" || asis.estado === "Incompleto" || asis.estado === "Atraso e Incompleto" ? (
                                                        <span className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300">
                                                            {asis.estado}
                                                        </span>
                                                    ) : asis.estado === "En hora" ? (
                                                        <span className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300">
                                                            {asis.estado}
                                                        </span>
                                                    ) : (
                                                        <span className="text-muted-foreground text-xs">-</span>
                                                    )}
                                                </TableCell>
                                                <TableCell className="text-right font-medium">
                                                    {calculateHours(asistencia.entrada, asistencia.salida)}
                                                </TableCell>
                                                <TableCell className="text-right font-bold text-amber-600 dark:text-amber-500">
                                                    {asis.horas_extra > 0 ? `${asis.horas_extra}h` : '-'}
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
    );
}
