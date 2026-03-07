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

    const [horarios, setHorarios] = useState<Record<number, { entrada: string, salida: string }>>({});

    // Fetch users once when dialog opens
    useEffect(() => {
        if (open && usuarios.length === 0) {
            const fetchUsers = async () => {
                setLoadingUsers(true);
                const supabase = createClient();
                const { data } = await supabase.from("usuarios").select("id, nombre_completo").eq("activo", true);
                if (data) {
                    setUsuarios(data);
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
                const newHorarios: Record<number, { entrada: string, salida: string }> = {};

                if (success && data && data.length > 0) {
                    data.forEach(h => {
                        newHorarios[h.dia_semana] = { entrada: h.hora_entrada, salida: h.hora_salida };
                    });
                } else {
                    // Default values if empty
                    DIAS_SEMANA.forEach(dia => {
                        newHorarios[dia.value] = { entrada: "08:00", salida: "18:00" };
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

    const handleTimeChange = (dia: number, field: 'entrada' | 'salida', value: string) => {
        setHorarios(prev => {
            const current = prev[dia] || { entrada: "08:00", salida: "18:00" };
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
            const payload = DIAS_SEMANA.map(dia => ({
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
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Horarios por Empleado</DialogTitle>
                    <DialogDescription>
                        Defina horarios específicos por día para un empleado (sobreescribe el horario de su rol).
                    </DialogDescription>
                </DialogHeader>

                <div className="grid gap-4 py-4">
                    <div className="flex flex-col gap-2">
                        <Label>Seleccionar Empleado</Label>
                        <Select value={selectedUser} onValueChange={setSelectedUser} disabled={loadingUsers}>
                            <SelectTrigger>
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
                        <div className="space-y-3 mt-2 max-h-[40vh] overflow-y-auto pr-2">
                            {DIAS_SEMANA.map((dia) => {
                                const data = horarios[dia.value] || { entrada: "08:00", salida: "18:00" };
                                return (
                                    <div key={dia.value} className="grid grid-cols-[100px_1fr_1fr] items-center gap-4 border-b pb-3 last:border-0 last:pb-0">
                                        <Label className="text-right capitalize font-bold">{dia.label}</Label>
                                        <div className="flex flex-col gap-1">
                                            <Label className="text-[10px] text-muted-foreground uppercase hidden sm:block">Entrada</Label>
                                            <Input
                                                type="time"
                                                value={data.entrada}
                                                onChange={(e) => handleTimeChange(dia.value, 'entrada', e.target.value)}
                                                className="text-sm"
                                            />
                                        </div>
                                        <div className="flex flex-col gap-1">
                                            <Label className="text-[10px] text-muted-foreground uppercase hidden sm:block">Salida</Label>
                                            <Input
                                                type="time"
                                                value={data.salida}
                                                onChange={(e) => handleTimeChange(dia.value, 'salida', e.target.value)}
                                                className="text-sm"
                                            />
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
                <DialogFooter>
                    <Button type="button" onClick={handleSave} disabled={loading || !selectedUser}>
                        {loading && <Loader2 className="animate-spin mr-2 h-4 w-4" />}
                        Guardar cambios
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
