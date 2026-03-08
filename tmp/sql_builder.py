import json
import sys

def get_clean_sql(json_file, tenant_id):
    with open(json_file, 'r', encoding='utf-16') as f:
        products = json.load(f)
    
    sql = ["BEGIN;"]
    sql.append("CREATE TEMP TABLE new_products (nombre text, codigo_barras text, precio_venta numeric, precio_compra numeric, stock_actual numeric, unidad_medida text, tipo text);")
    
    values = []
    for p in products:
        nombre = p['nombre'].replace("'", "''")
        codigo = f"'{p['codigo_barras']}'" if p['codigo_barras'] and p['codigo_barras'] != "None" else "NULL"
        values.append(f"('{nombre}', {codigo}, {p['precio_venta']}, {p['precio_compra']}, {p['stock_actual']}, '{p['unidad_medida']}', '{p['tipo']}')")
    
    sql.append(f"INSERT INTO new_products (nombre, codigo_barras, precio_venta, precio_compra, stock_actual, unidad_medida, tipo) VALUES \n" + ",\n".join(values) + ";")
    
    sql.append(f"""
    INSERT INTO public.productos (tenant_id, nombre, codigo_barras, precio_venta, precio_compra, stock_actual, unidad_medida, tipo, activo)
    SELECT '{tenant_id}', nombre, codigo_barras, precio_venta, precio_compra, stock_actual, unidad_medida, tipo, true
    FROM new_products;
    """)
    
    sql.append(f"""
    INSERT INTO public.ingresos_inventario (tenant_id, tipo_ingreso, notas)
    VALUES ('{tenant_id}', 'ajuste', 'Carga inicial de inventario desde Excel');
    """)
    
    sql.append(f"""
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
    
    sql.append("COMMIT;")
    return "\n".join(sql)

if __name__ == "__main__":
    # Generar el SQL completo y escribirlo a un archivo UTF-8 limpio
    sql_content = get_clean_sql(sys.argv[1], sys.argv[2])
    with open(sys.argv[3], 'w', encoding='utf-8') as f:
        f.write(sql_content)
