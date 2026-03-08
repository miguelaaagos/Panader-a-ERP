"use client"

import { useEffect, useRef, useState, useCallback, useMemo } from "react"
import { createClient } from "@/lib/supabase/client"
import { useERPStore } from '@/hooks/use-erp-store'
import { toast } from "sonner"
import { Html5Qrcode } from "html5-qrcode"
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
    Camera,
    Keyboard,
    X,
    Loader2,
    Barcode,
    CameraOff,
    Zap,
    Search,
    RefreshCw,
    AlertCircle
} from "lucide-react"
import { cn } from "@/lib/utils"

export function ScannerHandler() {
    const { isScannerActive, isCameraScannerOpen, setCameraScannerOpen, addItem } = useERPStore()
    const supabase = useMemo(() => createClient(), [])
    const buffer = useRef<string>("")
    const lastKeyTime = useRef<number>(0)
    const html5QrCodeRef = useRef<Html5Qrcode | null>(null)

    const [manualCode, setManualCode] = useState("")
    const [isSearching, setIsSearching] = useState(false)
    const [isCameraActive, setIsCameraActive] = useState(false)
    const [errorMsg, setErrorMsg] = useState<string | null>(null)
    const [activeTab, setActiveTab] = useState<string>("camera")

    const handleScan = useCallback(async (barcode: string) => {
        if (isSearching || !barcode) return

        setIsSearching(true)
        try {
            const { data, error } = await supabase
                .from("productos")
                .select("*")
                .eq("codigo", barcode)
                .single()

            if (error) {
                console.error("Error buscando producto:", error)
                toast.error(`Código no encontrado`, {
                    description: `El código "${barcode}" no está en el inventario.`,
                    icon: <AlertCircle className="h-4 w-4 text-destructive" />
                })
                return
            }

            if (data) {
                addItem(data)
                toast.success(`${data.nombre} añadido`, {
                    description: `Precio: $${(data.precio_venta ?? 0).toLocaleString()}`,
                    icon: <Zap className="h-4 w-4 text-yellow-500 fill-yellow-500" />,
                    duration: 2000,
                })
                // Feedback visual: vibración si es móvil
                if (typeof navigator !== 'undefined' && navigator.vibrate) {
                    navigator.vibrate(100)
                }
            }
        } finally {
            setIsSearching(false)
        }
    }, [addItem, supabase, isSearching])

    // Lógica para lector HID (Simulador de teclado)
    useEffect(() => {
        if (!isScannerActive) return

        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.target instanceof HTMLInputElement && e.target.id !== "manual-barcode-input") {
                return
            }

            const now = Date.now()
            if (now - lastKeyTime.current > 50) {
                buffer.current = ""
            }
            lastKeyTime.current = now

            if (e.key === "Enter") {
                if (buffer.current.length > 2) {
                    handleScan(buffer.current)
                    buffer.current = ""
                }
                return
            }

            if (e.key.length === 1 && /[a-zA-Z0-9]/.test(e.key)) {
                buffer.current += e.key
            }
        }

        window.addEventListener("keydown", handleKeyDown)
        return () => window.removeEventListener("keydown", handleKeyDown)
    }, [isScannerActive, handleScan])

    const startCamera = async () => {
        try {
            setErrorMsg(null)

            if (html5QrCodeRef.current) {
                try { await html5QrCodeRef.current.stop() } catch (e) { }
            }

            const html5QrCode = new Html5Qrcode("camera-canvas")
            html5QrCodeRef.current = html5QrCode

            const config = {
                fps: 15,
                qrbox: { width: 250, height: 180 },
                aspectRatio: 1.0
            }

            try {
                await html5QrCode.start(
                    { facingMode: "environment" },
                    config,
                    (decodedText) => handleScan(decodedText),
                    () => { }
                )
            } catch (err: any) {
                console.warn("Reintentando con cámara de usuario...")
                await html5QrCode.start(
                    { facingMode: "user" },
                    config,
                    (decodedText) => handleScan(decodedText),
                    () => { }
                )
            }

            setIsCameraActive(true)
        } catch (err: any) {
            console.error("Error cámara:", err)
            let message = "No se detectó ninguna cámara conectada."
            if (err.name === "NotAllowedError") message = "Permisos de cámara denegados."
            setErrorMsg(message)
            setIsCameraActive(false)
        }
    }

    const stopCamera = async () => {
        if (html5QrCodeRef.current) {
            try {
                if (html5QrCodeRef.current.isScanning) {
                    await html5QrCodeRef.current.stop()
                }
                setIsCameraActive(false)
            } catch (err) {
                console.error("Error cerrando cámara:", err)
            }
        }
    }

    useEffect(() => {
        if (!isCameraScannerOpen) {
            stopCamera()
        }
    }, [isCameraScannerOpen])

    const handleManualSubmit = (e: React.FormEvent) => {
        e.preventDefault()
        if (manualCode.trim() && !isSearching) {
            handleScan(manualCode.trim())
            setManualCode("")
        }
    }

    return (
        <Dialog open={isCameraScannerOpen} onOpenChange={(open) => {
            if (!open) stopCamera()
            setCameraScannerOpen(open)
        }}>
            <DialogContent className="sm:max-w-[480px] p-0 overflow-hidden bg-background/95 backdrop-blur-md border-primary/20 shadow-2xl">
                <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-primary/20 via-primary to-primary/20" />

                <DialogHeader className="p-8 pb-4">
                    <DialogTitle className="flex items-center gap-3 text-2xl font-black tracking-tight">
                        <div className="bg-primary p-2 rounded-lg shadow-lg">
                            <Barcode className="h-6 w-6 text-primary-foreground" />
                        </div>
                        Punto de Captura
                    </DialogTitle>
                    <DialogDescription className="text-muted-foreground/80 font-medium">
                        Añade productos de forma ágil a tu venta actual.
                    </DialogDescription>
                </DialogHeader>

                <div className="px-8 pb-8 space-y-6">
                    <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                        <TabsList className="grid w-full grid-cols-2 h-12 bg-muted/50 p-1 rounded-xl">
                            <TabsTrigger value="camera" className="rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm gap-2">
                                <Camera className="h-4 w-4" /> Cámara
                            </TabsTrigger>
                            <TabsTrigger value="manual" className="rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm gap-2">
                                <Keyboard className="h-4 w-4" /> Manual
                            </TabsTrigger>
                        </TabsList>

                        <TabsContent value="camera" className="mt-6 space-y-4 focus-visible:outline-none">
                            <div className="relative overflow-hidden rounded-2xl border-2 border-primary/10 bg-black aspect-[4/3] flex items-center justify-center shadow-inner">
                                <div id="camera-canvas" className="absolute inset-0 w-full h-full [&>video]:object-cover [&>video]:w-full [&>video]:h-full" />

                                {!isCameraActive && (
                                    <div className="flex flex-col items-center gap-5 text-center p-8 z-10">
                                        <div className="bg-primary/20 p-5 rounded-full animate-pulse">
                                            <CameraOff className="h-10 w-10 text-primary" />
                                        </div>
                                        <div className="space-y-2">
                                            <p className="text-sm font-bold text-white">
                                                {errorMsg || "La cámara está desactivada"}
                                            </p>
                                            <p className="text-xs text-white/50 max-w-[200px]">
                                                Asegúrate de tener una cámara conectada y dar permisos.
                                            </p>
                                        </div>
                                        <Button onClick={startCamera} className="h-11 px-8 rounded-full font-bold transition-all hover:scale-105 active:scale-95 shadow-lg shadow-primary/30 gap-2">
                                            <Camera className="h-5 w-5" />
                                            Activar Lector
                                        </Button>
                                    </div>
                                )}

                                {isCameraActive && (
                                    <div className="absolute inset-0 pointer-events-none z-10">
                                        <div className="absolute inset-0 bg-black/20" />
                                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-72 h-44 border-2 border-primary/50 rounded-lg shadow-[0_0_0_1000px_rgba(0,0,0,0.5)]">
                                            <div className="absolute top-0 left-0 w-4 h-4 border-t-4 border-l-4 border-primary rounded-tl-sm" />
                                            <div className="absolute top-0 right-0 w-4 h-4 border-t-4 border-r-4 border-primary rounded-tr-sm" />
                                            <div className="absolute bottom-0 left-0 w-4 h-4 border-b-4 border-l-4 border-primary rounded-bl-sm" />
                                            <div className="absolute bottom-0 right-0 w-4 h-4 border-b-4 border-r-4 border-primary rounded-br-sm" />

                                            <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-primary to-transparent animate-[scan_2s_ease-in-out_infinite] shadow-[0_0_10px_primary]" />
                                        </div>

                                        <Button
                                            variant="secondary"
                                            size="sm"
                                            className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20 h-9 rounded-full bg-black/60 hover:bg-black/80 text-white border-0 backdrop-blur-md pointer-events-auto shadow-xl"
                                            onClick={stopCamera}
                                        >
                                            <CameraOff className="h-4 w-4 mr-2" />
                                            Desconectar
                                        </Button>
                                    </div>
                                )}
                            </div>
                        </TabsContent>

                        <TabsContent value="manual" className="mt-6 space-y-4 focus-visible:outline-none">
                            <form onSubmit={handleManualSubmit} className="space-y-4">
                                <div className="space-y-2">
                                    <label className="text-xs font-black uppercase text-muted-foreground ml-1">Código del Producto</label>
                                    <div className="relative group">
                                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                            <Search className="h-5 w-5 text-muted-foreground transition-colors group-focus-within:text-primary" />
                                        </div>
                                        <Input
                                            id="manual-barcode-input"
                                            placeholder="Eje: 7791234567890"
                                            className="pl-12 h-14 bg-muted/30 border-2 border-primary/5 rounded-xl text-lg font-mono focus-visible:border-primary/40 focus-visible:ring-offset-0 transition-all shadow-sm"
                                            value={manualCode}
                                            onChange={(e) => setManualCode(e.target.value)}
                                            autoFocus
                                        />
                                    </div>
                                </div>
                                <Button
                                    type="submit"
                                    className="w-full h-14 rounded-xl text-lg font-black shadow-xl shadow-primary/20 transition-all hover:translate-y-[-2px] active:translate-y-[0px]"
                                    disabled={isSearching || !manualCode.trim()}
                                >
                                    {isSearching ? <Loader2 className="h-6 w-6 animate-spin mr-2" /> : <RefreshCw className="h-5 w-5 mr-2" />}
                                    BUSCAR Y AGREGAR
                                </Button>
                            </form>

                            <div className="p-4 rounded-xl bg-primary/5 border border-primary/10 flex gap-4 items-start">
                                <AlertCircle className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                                <div className="space-y-1">
                                    <p className="text-xs font-bold text-primary italic">Lectura con Escáner Externo</p>
                                    <p className="text-[11px] text-muted-foreground leading-relaxed">
                                        Si usas un lector de pistola, simplemente dispara al código. No necesitas escribir aquí nada.
                                    </p>
                                </div>
                            </div>
                        </TabsContent>
                    </Tabs>
                </div>

                <div className="bg-muted/50 p-6 border-t flex justify-between items-center bg-gradient-to-b from-transparent to-muted">
                    <div className="flex items-center gap-2">
                        <div className={cn("h-2 w-2 rounded-full", isCameraActive ? "bg-green-500 animate-pulse" : "bg-muted-foreground/30")} />
                        <span className="text-[10px] font-black uppercase tracking-tighter text-muted-foreground">
                            {isCameraActive ? "Sistema de Visión Listo" : "Modo de Espera"}
                        </span>
                    </div>
                    <Button variant="ghost" size="sm" className="h-9 hover:bg-background/80 font-bold" onClick={() => setCameraScannerOpen(false)}>
                        FINALIZAR
                    </Button>
                </div>
            </DialogContent>

            <style jsx global>{`
                #camera-canvas video {
                    width: 100% !important;
                    height: 100% !important;
                    object-fit: cover !important;
                }
                @keyframes scan {
                    0%, 100% { transform: translateY(0); opacity: 0; }
                    10% { opacity: 1; }
                    90% { opacity: 1; }
                    100% { transform: translateY(176px); opacity: 0; }
                }
            `}</style>
        </Dialog>
    )
}
