import { Croissant, Loader2 } from "lucide-react";

interface LoadingStateProps {
    message?: string;
}

export function LoadingState({ message = "Cargando..." }: LoadingStateProps) {
    return (
        <div className="flex h-full min-h-[400px] w-full flex-col items-center justify-center gap-6 p-8 text-center animate-in fade-in duration-500">
            <div className="relative flex items-center justify-center h-24 w-24">
                {/* Anillo exterior giratorio */}
                <Loader2 className="absolute h-full w-full animate-spin text-primary/20" strokeWidth={1} />

                {/* Ícono central con latido suave */}
                <div className="relative flex items-center justify-center animate-pulse duration-2000">
                    <div className="absolute h-16 w-16 rounded-full bg-primary/10 blur-xl"></div>
                    <Croissant className="relative h-10 w-10 text-primary drop-shadow-sm" />
                </div>
            </div>

            <div className="space-y-2">
                <h3 className="text-xl font-serif font-semibold text-foreground tracking-tight">
                    {message}
                </h3>
                <p className="text-sm text-muted-foreground max-w-[250px] mx-auto">
                    Preparando los datos con la misma frescura que nuestro pan.
                </p>
            </div>
        </div>
    );
}

export function DashboardLoadingState() {
    return <LoadingState message="Cargando tu panadería..." />;
}
