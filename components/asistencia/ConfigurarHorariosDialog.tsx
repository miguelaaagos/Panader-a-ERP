"use client";

import { useState } from "react";
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
import { Settings, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { HorarioRole, upsertHorarioRol } from "@/server/actions/horarios";

const ROLES_DISPONIBLES = ["admin", "cajero", "panadero", "pastelero"];

interface Props {
    horariosActuales: HorarioRole[];
}

export function ConfigurarHorariosDialog({ horariosActuales }: Props) {
    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(false);

    // Initialize state based on existing or default
    const [horarios, setHorarios] = useState<Record<string, { entrada: string, salida: string }>>(() => {
        const initial: Record<string, { entrada: string, salida: string }> = {};
        ROLES_DISPONIBLES.forEach(rol => {
            const config = horariosActuales.find(h => h.rol === rol);
            initial[rol] = {
                entrada: config?.hora_entrada || "08:00",
                salida: config?.hora_salida || "18:00"
            };
        });
        return initial;
    });

    const handleTimeChange = (rol: string, field: 'entrada' | 'salida', value: string) => {
        setHorarios(prev => {
            const current = prev[rol] || { entrada: "08:00", salida: "18:00" };
            return {
                ...prev,
                [rol]: {
                    ...current,
                    [field]: value
                }
            };
        });
    };

    const handleSave = async () => {
        setLoading(true);
        try {
            // Sequentially upsert all roles (in a real app a bulk action might be better)
            let hasError = false;
            for (const rol of ROLES_DISPONIBLES) {
                const data = horarios[rol] || { entrada: "08:00", salida: "18:00" };
                const res = await upsertHorarioRol(rol, data.entrada, data.salida);
                if (!res.success) {
                    hasError = true;
                }
            }

            if (!hasError) {
                toast.success("Horarios guardados correctamente.");
                setOpen(false);
            } else {
                toast.error("Hubo problemas guardando algunos horarios.");
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
                    <Settings className="mr-2 h-4 w-4" />
                    Configurar Horarios
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Horarios por Rol</DialogTitle>
                    <DialogDescription>
                        Defina el horario esperado de entrada y salida para cada rol de la empresa.
                    </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    {ROLES_DISPONIBLES.map((rol) => {
                        const data = horarios[rol] || { entrada: "08:00", salida: "18:00" };
                        return (
                            <div key={rol} className="grid grid-cols-[100px_1fr_1fr] items-center gap-4 border-b pb-3 last:border-0 last:pb-0">
                                <Label className="text-right capitalize font-bold">{rol}</Label>
                                <div className="flex flex-col gap-1">
                                    <Label className="text-[10px] text-muted-foreground uppercase hidden sm:block">Entrada</Label>
                                    <Input
                                        type="time"
                                        value={data.entrada}
                                        onChange={(e) => handleTimeChange(rol, 'entrada', e.target.value)}
                                        className="text-sm"
                                    />
                                </div>
                                <div className="flex flex-col gap-1">
                                    <Label className="text-[10px] text-muted-foreground uppercase hidden sm:block">Salida</Label>
                                    <Input
                                        type="time"
                                        value={data.salida}
                                        onChange={(e) => handleTimeChange(rol, 'salida', e.target.value)}
                                        className="text-sm"
                                    />
                                </div>
                            </div>
                        );
                    })}
                </div>
                <DialogFooter>
                    <Button type="button" onClick={handleSave} disabled={loading}>
                        {loading && <Loader2 className="animate-spin mr-2 h-4 w-4" />}
                        Guardar cambios
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
