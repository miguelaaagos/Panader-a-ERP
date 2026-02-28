import { Metadata } from "next"
import { validateRequest } from "@/lib/server/auth"
import { redirect } from "next/navigation"
import { CashierAttendanceView } from "@/components/asistencia/CashierAttendanceView"
import { AdminAttendanceView } from "@/components/asistencia/AdminAttendanceView"
import { getEstadoAsistencia, getAsistenciasRecientes } from "@/server/actions/attendance"

export const metadata: Metadata = {
    title: "Asistencia | Panadería ERP",
    description: "Control de reloj de asistencia para empleados",
}

interface AsistenciaPageProps {
    searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}

export default async function AsistenciaPage(props: AsistenciaPageProps) {
    const searchParams = await props.searchParams

    // 1. Validar autenticación
    let profile = null;
    try {
        const auth = await validateRequest();
        profile = auth.profile;
    } catch (error) {
        redirect("/login");
    }

    // 2. Determinar el mes y año para los filtros (por defecto mes actual)
    const now = new Date();
    const month = searchParams.month ? parseInt(searchParams.month as string, 10) : now.getMonth() + 1;
    const year = searchParams.year ? parseInt(searchParams.year as string, 10) : now.getFullYear();

    // 3. Obtener estado de turno activo del usuario actual
    const { activeTurn } = await getEstadoAsistencia();

    // 4. Obtener el listado de asistencias (filtrado por rol en el backend y fecha)
    const limit = profile.rol === "admin" ? 100 : 20; // Admin ve mas registros en tabla
    const { data: asistencias } = await getAsistenciasRecientes({
        limit,
        month: profile.rol === "admin" ? month : undefined, // Solo filtramos por mes si es admin
        year: profile.rol === "admin" ? year : undefined,
    });

    return (
        <div className="flex-1 space-y-4 p-4 pt-6 md:p-8">
            <div className="flex items-center justify-between space-y-2">
                <h2 className="text-3xl font-bold tracking-tight font-serif text-primary">Control de Asistencia</h2>
            </div>

            {profile.rol === "admin" ? (
                <AdminAttendanceView
                    asistencias={asistencias || []}
                    currentMonth={month}
                    currentYear={year}
                />
            ) : (
                <CashierAttendanceView
                    activeTurn={activeTurn || null}
                    asistencias={asistencias || []}
                />
            )}
        </div>
    )
}
