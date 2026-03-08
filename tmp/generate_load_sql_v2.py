import json
import sys
import os

def generate_sql(json_file, tenant_id):
    # Intentar leer con diferentes codificaciones debido a comportamientos de PowerShell
    products = None
    for encoding in ['utf-8', 'utf-16', 'utf-16-le', 'utf-16-be', 'latin-1']:
        try:
            with open(json_file, 'r', encoding=encoding) as f:
                content = f.read()
                # Quitar el BOM si existe
                if content.startswith('\ufeff'):
                    content = content[1:]
                products = json.loads(content)
                break
        except Exception:
            continue
            
    if products is None:
        raise Exception("No se pudo leer el JSON con ninguna codificación conocida.")
    
    sql_parts = ["BEGIN;"]
    sql_parts.append("CREATE TEMP TABLE new_products (nombre text, codigo_barras text, precio_venta numeric, precio_compra numeric, stock_actual numeric, unidad_medida text, tipo text);")
    
    values = []
    for p in products:
        nombre = p['nombre'].replace("'", "''")
        codigo = f"'{p['codigo_barras']}'" if p['codigo_barras'] and p['codigo_barras'] != "None" else "NULL"
        values.append(f"('{nombre}', {codigo}, {p['precio_venta']}, {p['precio_compra']}, {p['stock_actual']}, '{p['unidad_medida']}', '{p['tipo']}')")
    
    sql_parts.append(f"INSERT INTO new_products (nombre, codigo_barras, precio_venta, precio_compra, stock_actual, unidad_medida, tipo) VALUES \n" + ",\n".join(values) + ";")
    
    sql_parts.append(f"""
    INSERT INTO public.productos (tenant_id, nombre, codigo_barras, precio_venta, precio_compra, stock_actual, unidad_medida, tipo, activo)
    SELECT '{tenant_id}', nombre, codigo_barras, precio_venta, precio_compra, stock_actual, unidad_medida, tipo, true
    FROM new_products;
    """)
    
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
        sys.exit(1)
    try:
        print(generate_sql(sys.argv[1], sys.argv[2]))
    except Exception as e:
        sys.stderr.write(str(e))
        sys.exit(1)
