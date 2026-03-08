import json
import sys
import os

# Simularemos la generación de SQL para inserción masiva para evitar límites de payload en una sola llamada RPC si fuera muy grande,
# aunque para ~80 productos una sola llamada SQL es eficiente.

def generate_sql(json_file, tenant_id):
    with open(json_file, 'r', encoding='utf-8') as f:
        products = json.load(f)
    
    # 1. Inserción de productos
    sql_parts = ["BEGIN;"]
    
    # Creamos una tabla temporal para los productos para facilitar el manejo
    sql_parts.append("CREATE TEMP TABLE new_products (nombre text, codigo_barras text, precio_venta numeric, precio_compra numeric, stock_actual numeric, unidad_medida text, tipo text);")
    
    values = []
    for p in products:
        # Escapar comillas simples en nombres
        nombre = p['nombre'].replace("'", "''")
        codigo = f"'{p['codigo_barras']}'" if p['codigo_barras'] else "NULL"
        values.append(f"('{nombre}', {codigo}, {p['precio_venta']}, {p['precio_compra']}, {p['stock_actual']}, '{p['unidad_medida']}', '{p['tipo']}')")
    
    sql_parts.append(f"INSERT INTO new_products (nombre, codigo_barras, precio_venta, precio_compra, stock_actual, unidad_medida, tipo) VALUES \n" + ",\n".join(values) + ";")
    
    # Insertar en la tabla real de productos asociando el tenant_id
    sql_parts.append(f"""
    INSERT INTO public.productos (tenant_id, nombre, codigo_barras, precio_venta, precio_compra, stock_actual, unidad_medida, tipo, activo)
    SELECT '{tenant_id}', nombre, codigo_barras, precio_venta, precio_compra, stock_actual, unidad_medida, tipo, true
    FROM new_products;
    """)
    
    # 2. Generar movimiento de inventario inicial para trazabilidad (Opcional pero recomendado)
    sql_parts.append(f"""
    INSERT INTO public.ingresos_inventario (tenant_id, tipo_ingreso, notas)
    VALUES ('{tenant_id}', 'ajuste', 'Carga inicial de inventario desde Excel');
    """)
    
    sql_parts.append(f"""
    INSERT INTO public.ingreso_inventario_detalles (ingreso_id, producto_id, cantidad, costo_unitario)
    SELECT 
        (SELECT id FROM public.ingresos_inventario WHERE tenant_id = '{tenant_id}' ORDER BY created_at DESC LIMIT 1),
        p.id,
        np.stock_actual,
        np.precio_compra
    FROM public.productos p
    JOIN new_products np ON p.nombre = np.nombre
    WHERE p.tenant_id = '{tenant_id}' AND np.stock_actual > 0;
    """)
    
    sql_parts.append("COMMIT;")
    
    return "\n".join(sql_parts)

if __name__ == "__main__":
    if len(sys.argv) < 3:
        print("Uso: python script.py <json_file> <tenant_id>")
        sys.exit(1)
    print(generate_sql(sys.argv[1], sys.argv[2]))
