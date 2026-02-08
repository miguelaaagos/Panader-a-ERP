
const { createClient } = require('@supabase/supabase-js');

// Intentar leer variables de entorno si están disponibles en process.env
// Asumimos que el usuario las tiene seteadas en su terminal o .env
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error("Error: Faltan variables de entorno NEXT_PUBLIC_SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY");
    console.log("Por favor, ejecute este script asegurándose de que las variables de entorno estén cargadas.");
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function debugSale() {
    console.log("--- Iniciando Depuración de Venta ---");

    // 1. Obtener un usuario de prueba (el primero que encuentre)
    const { data: { users }, error: userError } = await supabase.auth.admin.listUsers();

    if (userError) {
        console.error("Error al listar usuarios:", userError);
        return;
    }

    if (!users || users.length === 0) {
        console.error("No se encontraron usuarios en Auth.");
        return;
    }

    const user = users[0];
    console.log(`Usuario encontrado: ${user.email} (ID: ${user.id})`);

    // 2. Verificar si existe perfil
    const { data: profile, error: profileError } = await supabase
        .from('perfiles')
        .select('*')
        .eq('id', user.id)
        .single();

    if (profileError) {
        console.log("Nota: Error al buscar perfil (puede que no exista):", profileError.message);
    }

    if (!profile) {
        console.warn("ALERTA: El usuario NO tiene un registro en la tabla 'perfiles'. Esto causará error de clave foránea.");
    } else {
        console.log("Perfil encontrado OK.");
    }

    // 3. Intentar insertar una venta de prueba
    console.log("Intentando insertar venta de prueba...");

    const ventaData = {
        perfil_id: user.id,
        metodo_pago: 'Efectivo',
        total: 1500,
        tipo_documento: 'Boleta',
        anulada: false,
        created_at: new Date().toISOString() // Asegurar fecha
    };

    const { data, error } = await supabase
        .from('ventas')
        .insert(ventaData)
        .select()
        .single();

    if (error) {
        console.error("❌ ERROR AL INSERTAR VENTA:");
        console.error(JSON.stringify(error, null, 2));
    } else {
        console.log("✅ Venta insertada correctamente:", data);

        // Limpieza: borrar la venta de prueba
        console.log("Limpiando venta de prueba...");
        await supabase.from('ventas').delete().eq('id', data.id);
    }
}

debugSale().catch(err => console.error("Error inesperado:", err));
