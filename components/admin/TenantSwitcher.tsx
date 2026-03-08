"use client"

import { useState, useEffect } from "react"
import { Building2, Check, ChevronsUpDown, XCircle } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
} from "@/components/ui/command"
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover"
import { getTenantsList, switchTenantContext, getMyImpersonation } from "@/actions/admin"
import { toast } from "sonner"
import { useRouter } from "next/navigation"

export function TenantSwitcher() {
    const [open, setOpen] = useState(false)
    const [value, setValue] = useState("")
    const [tenants, setTenants] = useState<{ id: string; name: string }[]>([])
    const [currentImpersonation, setCurrentImpersonation] = useState<{ id: string | null; name: string | null }>({ id: null, name: null })
    const [loading, setLoading] = useState(true)
    const router = useRouter()

    useEffect(() => {
        async function loadData() {
            setLoading(true)
            const [tenantsRes, impersonationRes] = await Promise.all([
                getTenantsList(),
                getMyImpersonation()
            ])

            if (tenantsRes.success && tenantsRes.data) {
                setTenants(tenantsRes.data)
            }

            if (impersonationRes.success) {
                setCurrentImpersonation({
                    id: (impersonationRes as any).impersonatedId || null,
                    name: (impersonationRes as any).tenantName || null
                })
                setValue((impersonationRes as any).impersonatedId || "")
            }
            setLoading(false)
        }
        loadData()
    }, [])

    const onSelect = async (tenantId: string | null) => {
        const promise = switchTenantContext(tenantId)

        toast.promise(promise, {
            loading: "Cambiando de contexto...",
            success: () => {
                setOpen(false)
                router.refresh()
                return tenantId ? "Contexto cambiado con éxito" : "Vuelto al contexto global"
            },
            error: "Error al cambiar de contexto"
        })
    }

    if (loading) return <div className="h-10 w-full animate-pulse bg-muted rounded-md" />

    return (
        <div className="flex flex-col gap-2 p-4 bg-primary/5 rounded-lg border border-primary/10">
            <div className="flex items-center gap-2 text-xs font-bold text-primary uppercase tracking-wider">
                <Building2 className="h-3 w-3" />
                Contexto de Negocio
            </div>

            <Popover open={open} onOpenChange={setOpen}>
                <PopoverTrigger asChild>
                    <Button
                        variant="outline"
                        role="combobox"
                        aria-expanded={open}
                        className="w-full justify-between bg-background"
                    >
                        {currentImpersonation.name || "Global / Mi Local"}
                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[200px] p-0">
                    <Command>
                        <CommandInput placeholder="Buscar local..." />
                        <CommandList>
                            <CommandEmpty>No se encontró el local.</CommandEmpty>
                            <CommandGroup>
                                <CommandItem
                                    value="global"
                                    onSelect={() => onSelect(null)}
                                    className="cursor-pointer"
                                >
                                    <Check
                                        className={cn(
                                            "mr-2 h-4 w-4",
                                            !currentImpersonation.id ? "opacity-100" : "opacity-0"
                                        )}
                                    />
                                    Global / Mi Local
                                </CommandItem>
                                {tenants.map((tenant) => (
                                    <CommandItem
                                        key={tenant.id}
                                        value={tenant.id}
                                        onSelect={() => onSelect(tenant.id)}
                                        className="cursor-pointer"
                                    >
                                        <Check
                                            className={cn(
                                                "mr-2 h-4 w-4",
                                                currentImpersonation.id === tenant.id ? "opacity-100" : "opacity-0"
                                            )}
                                        />
                                        {tenant.name}
                                    </CommandItem>
                                ))}
                            </CommandGroup>
                        </CommandList>
                    </Command>
                </PopoverContent>
            </Popover>

            {currentImpersonation.id && (
                <Button
                    variant="ghost"
                    size="sm"
                    className="text-[10px] h-6 text-destructive hover:text-destructive hover:bg-destructive/10"
                    onClick={() => onSelect(null)}
                >
                    <XCircle className="h-3 w-3 mr-1" />
                    Salir de suplantación
                </Button>
            )}
        </div>
    )
}
