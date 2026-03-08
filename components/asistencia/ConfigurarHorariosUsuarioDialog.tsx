"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CalendarClock, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { getHorariosUsuario, upsertHorariosUsuario } from "@/server/actions/horarios";
import { createClient } from "@/lib/supabase/client";

const DIAS_SEMANA = [
    { value: 1, label: "Lunes" },
    { value: 2, label: "Martes" },
    { value: 3, label: "Miércoles" },
    { value: 4, label: "Jueves" },
    { value: 5, label: "Viernes" },
    { value: 6, label: "Sábado" },
    { value: 7, label: "Domingo" }
];

export function ConfigurarHorariosUsuarioDialog() {
    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [loadingUsers, setLoadingUsers] = useState(false);
    const [usuarios, setUsuarios] = useState<{ id: string, nombre_completo: string }[]>([]);
    const [selectedUser, setSelectedUser] = useState<string>("");

    const [horarios, setHorarios] = useState<Record<number, { entrada: string, salida: string, active: boolean }>>({});

    // Fetch users once when dialog opens
    useEffect(() => {
        if (open && usuarios.length === 0) {
            const fetchUsers = async () => {
                setLoadingUsers(true);
                const supabase = createClient();
                const { data } = await supabase.from("usuarios").select("id, nombre_completo").eq("activo", true);
                if (data) {
                    setUsuarios(data as { id: string, nombre_completo: string }[]);
                }
                setLoadingUsers(false);
            };
            fetchUsers();
        }
    }, [open]);

    // Fetch specific user's schedules when user changes
    useEffect(() => {
        if (selectedUser) {
            const fetchUserSchedules = async () => {
                setLoadingUsers(true);
                const { success, data } = await getHorariosUsuario(selectedUser);
                const newHorarios: Record<number, { entrada: string, salida: string, active: boolean }> = {};

                // Inicializar todos como inactivos por defecto
                DIAS_SEMANA.forEach(dia => {
                    newHorarios[dia.value] = {
                        entrada: "08:00",
                        salida: "18:00",
                        active: dia.value <= 5 // Lun-Vie activos por defecto
                    };
                });

                if (success && data && data.length > 0) {
                    data.forEach(h => {
                        newHorarios[h.dia_semana] = {
                            entrada: h.hora_entrada,
                            salida: h.hora_salida,
                            active: true
                        };
                    });
                }

                setHorarios(newHorarios);
                setLoadingUsers(false);
            };
            fetchUserSchedules();
        } else {
            setHorarios({});
        }
    }, [selectedUser]);

    const handleToggleDay = (dia: number) => {
        setHorarios(prev => {
            const current = prev[dia] || { entrada: "08:00", salida: "18:00", active: false };
            return {
                ...prev,
                [dia]: {
                    ...current,
                    active: !current.active
                }
            };
        });
    };

    const handleTimeChange = (dia: number, field: 'entrada' | 'salida', value: string) => {
        setHorarios(prev => {
            const current = prev[dia] || { entrada: "08:00", salida: "18:00", active: true };
            return {
                ...prev,
                [dia]: {
                    ...current,
                    [field]: value
                }
            };
        });
    };

    const handleSave = async () => {
        if (!selectedUser) {
            toast.error("Debe seleccionar un empleado.");
            return;
        }

        setLoading(true);
        try {
            // Solo enviar los días marcados como activos
            const payload = DIAS_SEMANA
                .filter(dia => horarios[dia.value]?.active)
                .map(dia => ({
                    dia_semana: dia.value,
                    hora_entrada: horarios[dia.value]?.entrada || "08:00",
                    hora_salida: horarios[dia.value]?.salida || "18:00"
                }));

            const res = await upsertHorariosUsuario(selectedUser, payload);

            if (res.success) {
                toast.success("Horarios del empleado guardados correctamente.");
                setOpen(false);
            } else {
                toast.error(res.error || "Hubo problemas guardando los horarios.");
            }

        } catch (err) {
            toast.error("Error de servidor.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="outline" size="sm" className="hidden sm:flex">
                    <CalendarClock className="mr-2 h-4 w-4" />
                    Horarios Especiales
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle>Horarios por Empleado</DialogTitle>
                    <DialogDescription>
                        Defina horarios específicos por día para un empleado (sobreescribe el horario de su rol).
                    </DialogDescription>
                </DialogHeader>

                <div className="grid gap-6 py-4">
                    <div className="flex flex-col gap-2">
                        <Label className="text-sm font-semibold">Seleccionar Empleado</Label>
                        <Select value={selectedUser} onValueChange={setSelectedUser} disabled={loadingUsers}>
                            <SelectTrigger className="bg-background/50 border-primary/20">
                                <SelectValue placeholder={loadingUsers ? "Cargando..." : "Seleccione un empleado"} />
                            </SelectTrigger>
                            <SelectContent>
                                {usuarios.map(u => (
                                    <SelectItem key={u.id} value={u.id}>
                                        {u.nombre_completo}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    {selectedUser && (
                        <div className="space-y-6">
                            <div className="flex flex-col gap-3">
                                <Label className="text-sm font-semibold">Días Laborales</Label>
                                <div className="grid grid-cols-7 gap-2">
                                    {DIAS_SEMANA.map((dia) => {
                                        const isActive = horarios[dia.value]?.active;
                                        return (
                                            <button
                                                key={dia.value}
                                                type="button"
                                                onClick={() => handleToggleDay(dia.value)}
                                                className={`
                                                    flex flex-col items-center justify-center p-2 rounded-lg border transition-all duration-200
                                                    ${isActive
                                                        ? 'bg-emerald-500/10 border-emerald-500 text-emerald-600 dark:text-emerald-400 font-bold shadow-sm shadow-emerald-500/20'
                                                        : 'bg-rose-500/5 border-rose-200 dark:border-rose-900/30 text-rose-400 dark:text-rose-800 opacity-60'
                                                    }
                                                `}
                                            >
                                                <span className="text-[10px] uppercase">{dia.label.substring(0, 3)}</span>
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>

                            <div className="space-y-4 max-h-[35vh] overflow-y-auto px-1">
                                {DIAS_SEMANA.filter(dia => horarios[dia.value]?.active).map((dia) => {
                                    const data = horarios[dia.value] || { entrada: "08:00", salida: "18:00" };
                                    return (
                                        <div
                                            key={dia.value}
                                            className="grid grid-cols-[100px_1fr_1fr] items-center gap-4 p-3 rounded-xl bg-muted/30 border border-muted animate-in fade-in slide-in-from-top-2 duration-300"
                                        >
                                            <Label className="capitalize font-bold text-sm">{dia.label}</Label>
                                            <div className="flex flex-col gap-1.5">
                                                <Label className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider pl-1">Entrada</Label>
                                                <Input
                                                    type="time"
                                                    value={data.entrada}
                                                    onChange={(e) => handleTimeChange(dia.value, 'entrada', e.target.value)}
                                                    className="h-9 text-sm bg-background border-primary/10 focus:border-primary/40"
                                                />
                                            </div>
                                            <div className="flex flex-col gap-1.5">
                                                <Label className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider pl-1">Salida</Label>
                                                <Input
                                                    type="time"
                                                    value={data.salida}
                                                    onChange={(e) => handleTimeChange(dia.value, 'salida', e.target.value)}
                                                    className="h-9 text-sm bg-background border-primary/10 focus:border-primary/40"
                                                />
                                            </div>
                                        </div>
                                    );
                                })}
                                {DIAS_SEMANA.filter(dia => horarios[dia.value]?.active).length === 0 && (
                                    <div className="text-center py-6 text-muted-foreground border-2 border-dashed rounded-xl">
                                        <p className="text-sm italic">Seleccione días arriba para configurar horarios.</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>
                <DialogFooter className="bg-muted/30 -mx-6 -mb-6 p-6 rounded-b-lg border-t mt-2">
                    <Button
                        type="button"
                        onClick={handleSave}
                        disabled={loading || !selectedUser}
                        className="w-full sm:w-auto px-8"
                    >
                        {loading && <Loader2 className="animate-spin mr-2 h-4 w-4" />}
                        Guardar cambios
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
