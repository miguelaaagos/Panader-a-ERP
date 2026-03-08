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
import { ConfigurarHorariosUsuarioDialog } from "./ConfigurarHorariosUsuarioDialog";
import { HorarioRole, HorarioUsuario } from "@/server/actions/horarios";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { HorariosOverview } from "./HorariosOverview";
import { HorasExtrasSummary } from "./HorasExtrasSummary";
import { Clock, History, CalendarDays } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface Props {
    asistencias: AsistenciaRow[];
    currentMonth: number;
    currentYear: number;
    horariosActuales?: HorarioRole[];
    todosLosHorariosUsuarios?: (HorarioUsuario & { usuarios: { id: string, nombre_completo: string, rol: string } })[];
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

export function AdminAttendanceView({
    asistencias,
    currentMonth,
    currentYear,
    horariosActuales = [],
    todosLosHorariosUsuarios = []
}: Props) {
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
            <Card className="border-primary/10 shadow-xl shadow-primary/5">
                <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-4 border-b bg-muted/20">
                    <div>
                        <CardTitle className="text-2xl font-bold tracking-tight">Control de Asistencia</CardTitle>
                        <CardDescription>
                            Gestión centralizada de horarios, asistencia y horas extras.
                        </CardDescription>
                    </div>

                    <div className="flex flex-wrap gap-2">
                        <Select
                            value={currentMonth.toString()}
                            onValueChange={(val) => handleFilterChange("month", val)}
                        >
                            <SelectTrigger className="w-[140px] bg-background">
                                <SelectValue placeholder="Mes" />
                            </SelectTrigger>
                            <SelectContent>
                                {MONTHS.map(m => (
                                    <SelectItem key={m.value} value={m.value.toString()}>
                                        {m.label}
                                    </SelectItem>
                                )) || null}
                            </SelectContent>
                        </Select>

                        <Select
                            value={currentYear.toString()}
                            onValueChange={(val) => handleFilterChange("year", val)}
                        >
                            <SelectTrigger className="w-[110px] bg-background">
                                <SelectValue placeholder="Año" />
                            </SelectTrigger>
                            <SelectContent>
                                {years.map(y => (
                                    <SelectItem key={y} value={y.toString()}>
                                        {y}
                                    </SelectItem>
                                )) || null}
                            </SelectContent>
                        </Select>
                        <Button
                            variant="outline"
                            onClick={() => router.push(pathname)}
                            title="Limpiar filtros"
                            className="bg-background"
                        >
                            Limpiar
                        </Button>
                        <ConfigurarHorariosUsuarioDialog />
                        <ConfigurarHorariosDialog horariosActuales={horariosActuales} />
                    </div>
                </CardHeader>
                <CardContent className="pt-6">
                    <Tabs defaultValue="historial" className="w-full">
                        <TabsList className="grid w-full grid-cols-3 mb-8 bg-muted/50 p-1 rounded-xl max-w-2xl mx-auto">
                            <TabsTrigger value="historial" className="rounded-lg data-[state=active]:bg-primary data-[state=active]:text-primary-foreground flex items-center gap-2 py-2">
                                <History className="h-4 w-4" />
                                Historial
                            </TabsTrigger>
                            <TabsTrigger value="overview" className="rounded-lg data-[state=active]:bg-primary data-[state=active]:text-primary-foreground flex items-center gap-2 py-2">
                                <CalendarDays className="h-4 w-4" />
                                Vista General
                            </TabsTrigger>
                            <TabsTrigger value="extras" className="rounded-lg data-[state=active]:bg-primary data-[state=active]:text-primary-foreground flex items-center gap-2 py-2">
                                <Clock className="h-4 w-4" />
                                Horas Extras
                            </TabsTrigger>
                        </TabsList>

                        <TabsContent value="historial" className="mt-0 animate-in fade-in slide-in-from-left-4 duration-500">
                            <div className="rounded-xl border bg-card/50 backdrop-blur-sm overflow-hidden">
                                <Table>
                                    <TableHeader className="bg-muted/50">
                                        <TableRow>
                                            <TableHead className="font-bold">Empleado</TableHead>
                                            <TableHead className="font-bold">Fecha</TableHead>
                                            <TableHead className="font-bold">Entrada</TableHead>
                                            <TableHead className="font-bold">Salida</TableHead>
                                            <TableHead className="font-bold">Estado</TableHead>
                                            <TableHead className="text-right font-bold">Duración</TableHead>
                                            <TableHead className="text-right font-bold">Extras</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {asistencias.length === 0 ? (
                                            <TableRow>
                                                <TableCell colSpan={7} className="text-center h-32 text-muted-foreground italic">
                                                    No hay registros de asistencia en este periodo.
                                                </TableCell>
                                            </TableRow>
                                        ) : (
                                            asistencias.map((asistencia) => {
                                                const fechaEntrada = new Date(asistencia.entrada);
                                                const asis = asistencia as unknown as { estado: string, horas_extra: number };

                                                return (
                                                    <TableRow key={asistencia.id} className="hover:bg-muted/30 transition-colors">
                                                        <TableCell className="font-medium p-4">
                                                            <div className="flex flex-col">
                                                                <span className="text-sm">{asistencia.usuarios?.nombre_completo || "Usuario Desconocido"}</span>
                                                                <span className="text-[10px] uppercase text-muted-foreground tracking-wider">
                                                                    {asistencia.usuarios?.rol}
                                                                </span>
                                                            </div>
                                                        </TableCell>
                                                        <TableCell className="text-sm whitespace-nowrap">{format(fechaEntrada, "dd MMM yyyy", { locale: es })}</TableCell>
                                                        <TableCell className="text-sm font-mono">{format(fechaEntrada, "hh:mm a")}</TableCell>
                                                        <TableCell className="text-sm font-mono">
                                                            {asistencia.salida ? (
                                                                format(new Date(asistencia.salida), "hh:mm a")
                                                            ) : (
                                                                <Badge variant="secondary" className="bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20">
                                                                    En curso
                                                                </Badge>
                                                            )}
                                                        </TableCell>
                                                        <TableCell>
                                                            {asis.estado === "Atraso" || asis.estado === "Incompleto" || asis.estado === "Atraso e Incompleto" ? (
                                                                <Badge variant="outline" className="bg-red-500/5 text-red-600 border-red-500/20">
                                                                    {asis.estado}
                                                                </Badge>
                                                            ) : asis.estado === "En hora" ? (
                                                                <Badge variant="outline" className="bg-emerald-500/5 text-emerald-600 border-emerald-500/20">
                                                                    {asis.estado}
                                                                </Badge>
                                                            ) : (
                                                                <span className="text-muted-foreground text-xs font-mono">-</span>
                                                            )}
                                                        </TableCell>
                                                        <TableCell className="text-right text-sm font-bold">
                                                            {calculateHours(asistencia.entrada, asistencia.salida)}
                                                        </TableCell>
                                                        <TableCell className="text-right font-black text-xs text-amber-600 dark:text-amber-500">
                                                            {asis.horas_extra > 0 ? `${asis.horas_extra}h` : '—'}
                                                        </TableCell>
                                                    </TableRow>
                                                );
                                            })
                                        )}
                                    </TableBody>
                                </Table>
                            </div>
                        </TabsContent>

                        <TabsContent value="overview" className="mt-0 animate-in fade-in slide-in-from-right-4 duration-500">
                            <HorariosOverview schedules={todosLosHorariosUsuarios} />
                        </TabsContent>

                        <TabsContent value="extras" className="mt-0 animate-in fade-in slide-in-from-bottom-4 duration-500">
                            <HorasExtrasSummary asistencias={asistencias} />
                        </TabsContent>
                    </Tabs>
                </CardContent>
            </Card>
        </div>
    );
}
