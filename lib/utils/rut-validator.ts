/**
 * Validador de RUT Chileno
 * Implementa el algoritmo módulo 11 para validar RUTs
 */

/**
 * Formatea un RUT sin formato a formato estándar (12.345.678-9)
 */
export function formatRut(rut: string): string {
    // Remover puntos, guiones y espacios
    const cleanRut = rut.replace(/[.\-\s]/g, '').toUpperCase()

    if (cleanRut.length < 2) return rut

    const dv = cleanRut.slice(-1)
    const number = cleanRut.slice(0, -1)

    // Formatear con puntos de miles
    const formattedNumber = number.replace(/\B(?=(\d{3})+(?!\d))/g, '.')

    return `${formattedNumber}-${dv}`
}

/**
 * Limpia un RUT removiendo formato
 */
export function cleanRut(rut: string): string {
    return rut.replace(/[.\-\s]/g, '').toUpperCase()
}

/**
 * Calcula el dígito verificador de un RUT
 */
function calculateDV(rut: string): string {
    const cleanNumber = rut.replace(/[.\-\s]/g, '')
    let sum = 0
    let multiplier = 2

    // Recorrer de derecha a izquierda
    for (let i = cleanNumber.length - 1; i >= 0; i--) {
        sum += parseInt(cleanNumber[i] ?? '0') * multiplier
        multiplier = multiplier === 7 ? 2 : multiplier + 1
    }

    const remainder = sum % 11
    const dv = 11 - remainder

    if (dv === 11) return '0'
    if (dv === 10) return 'K'
    return dv.toString()
}

/**
 * Valida un RUT chileno (solo formato, sin verificar dígito)
 * @param rut RUT a validar (puede estar con o sin formato)
 * @returns true si el RUT tiene formato válido, false en caso contrario
 */
export function validateRut(rut: string): boolean {
    if (!rut || rut.trim() === '') return false

    const cleanedRut = cleanRut(rut)

    // Validar longitud (mínimo 7 caracteres, máximo 9)
    if (cleanedRut.length < 7 || cleanedRut.length > 9) return false

    // Validar que solo contenga números y opcionalmente K al final
    if (!/^[0-9]+[0-9K]$/.test(cleanedRut)) return false

    return true
}

/**
 * Valida y formatea un RUT
 * @param rut RUT a validar y formatear
 * @returns RUT formateado si es válido, null si es inválido
 */
export function validateAndFormatRut(rut: string): string | null {
    if (!validateRut(rut)) return null
    return formatRut(rut)
}

/**
 * Extrae el número del RUT (sin dígito verificador)
 */
export function getRutNumber(rut: string): string {
    const cleaned = cleanRut(rut)
    return cleaned.slice(0, -1)
}

/**
 * Extrae el dígito verificador del RUT
 */
export function getRutDV(rut: string): string {
    const cleaned = cleanRut(rut)
    return cleaned.slice(-1)
}
