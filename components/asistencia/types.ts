import { Database } from "@/types/database.types";

export type AsistenciaRow = Database["public"]["Tables"]["asistencias"]["Row"] & {
    usuarios?: {
        nombre_completo: string | null;
        email: string;
        rol: string;
    } | null;
};
