---
name: shell-syntax-rules
description: Reglas de sintaxis para ejecución de comandos en el entorno local (Windows PowerShell). Prohíbe el uso de && para encadenar comandos.
---

# Shell Syntax Rules (Windows/PowerShell)

Para evitar errores de ejecución en el entorno del usuario (Windows con PowerShell), se deben seguir estrictamente estas reglas al generar o ejecutar comandos mediante `run_command`.

## 1. Prohibición de `&&`
- **Regla:** NUNCA uses `&&` para enlazar múltiples comandos. PowerShell (en versiones antiguas o configuraciones específicas) no reconoce `&&` como un separador válido.
- **Error común:** `git add . && git commit -m "update"` -> **FALLA**.

## 2. Uso de `;` o Comandos Separados
- **Solución ✅:** Usa el punto y coma `;` para separar comandos en una sola línea o ejecuta los comandos en llamadas de `run_command` independientes.
- **Ejemplo correcto:** `git add .; git commit -m "update"` o simplemente enviarlos por separado.

## 3. Comillas en Rutas
- **Regla:** Siempre usa comillas simples `'` o dobles `"` para rutas que contengan espacios.
- **Ejemplo:** `cd 'C:\Users\Migue\OneDrive\Escritorio\POS Panadería Software'`

## 4. Verificación de Entorno
- Recuerda que el sistema reporta que el OS es **Windows** y la Shell es **PowerShell**. Ajusta la sintaxis de los comandos (como `ls` vs `dir`, `rm -rf` vs `Remove-Item`) según sea necesario, aunque PowerShell suele tener alias para los comandos básicos de Unix.
