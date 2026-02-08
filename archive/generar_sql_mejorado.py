import json

def generate_sql_from_json():
    try:
        with open("inventario_consolidado.json", "r", encoding="utf-8") as f:
            data = json.load(f)

        sql_lines = []
        
        # Encabezado
        sql_lines.append("-- ============================================================")
        sql_lines.append("-- CARGA DE PRODUCTOS CON PRECIOS CORRECTOS")
        sql_lines.append("-- ============================================================")
        sql_lines.append("-- Ejecutar en Supabase Dashboard > SQL Editor")
        sql_lines.append("-- ============================================================\n")
        
        # 1. Limpiar productos existentes
        sql_lines.append("-- Paso 1: Limpiar productos existentes")
        sql_lines.append("DELETE FROM productos;\n")
        
        # 2. Insertar Categorías
        sql_lines.append("-- Paso 2: Insertar Categorías")
        for cat in data["categorias"]:
            slug = cat.lower().replace("í", "i").replace("é", "e").replace("á", "a")
            sql_lines.append(f"INSERT INTO categorias (nombre, slug) VALUES ('{cat}', '{slug}') ON CONFLICT (nombre) DO NOTHING;")
        
        sql_lines.append("\n-- Paso 3: Insertar Productos con precios correctos")
        
        # 3. Insertar Productos
        for p in data["productos"]:
            name = p["nombre"].replace("'", "''")
            barcode = p.get("codigo_barras")
            precio_venta = p.get("precio_venta", 0)
            precio_costo = p.get("precio_costo", 0)
            margen = p.get("margen_porcentaje", 0.5)
            stock = p.get("stock_cantidad", 0)
            es_pesable = "true" if p.get("es_pesable", False) else "false"
            
            # Categorización inteligente
            name_lower = name.lower()
            if any(kw in name_lower for kw in ["bebida", "coca", "nectar", "jugo", "agua", "sprite", "fanta"]):
                categoria = "Bebidas"
            elif any(kw in name_lower for kw in ["queque", "pan", "hallulla", "marraqueta", "dobladita"]):
                categoria = "Panadería"
            elif any(kw in name_lower for kw in ["chocolate", "dulce", "caramelo", "galleta"]):
                categoria = "Confitería"
            else:
                categoria = "Abarrotes"
            
            if barcode:
                sql_lines.append(
                    f"INSERT INTO productos (codigo_barras, nombre, categoria_id, precio_costo, margen_porcentaje, precio_venta, stock_cantidad, es_pesable) "
                    f"VALUES ('{barcode}', '{name}', (SELECT id FROM categorias WHERE nombre = '{categoria}' LIMIT 1), "
                    f"{precio_costo}, {margen}, {precio_venta}, {stock}, {es_pesable});"
                )
            else:
                sql_lines.append(
                    f"INSERT INTO productos (nombre, categoria_id, precio_costo, margen_porcentaje, precio_venta, stock_cantidad, es_pesable) "
                    f"VALUES ('{name}', (SELECT id FROM categorias WHERE nombre = '{categoria}' LIMIT 1), "
                    f"{precio_costo}, {margen}, {precio_venta}, {stock}, {es_pesable});"
                )
        
        sql_lines.append("\n-- Verificación")
        sql_lines.append("SELECT COUNT(*) as total_productos FROM productos;")
        sql_lines.append("SELECT nombre, precio_venta, es_pesable FROM productos LIMIT 5;")

        with open("carga_productos_completa.sql", "w", encoding="utf-8") as f:
            f.write("\n".join(sql_lines))
        
        print(f"✅ Éxito: Archivo carga_productos_completa.sql generado")
        print(f"📦 Total de productos: {len(data['productos'])}")
        print(f"\n📋 Próximo paso:")
        print(f"   1. Ve a Supabase Dashboard > SQL Editor")
        print(f"   2. Abre el archivo carga_productos_completa.sql")
        print(f"   3. Copia todo el contenido y pégalo en el SQL Editor")
        print(f"   4. Presiona 'Run' (Ctrl+Enter)")

    except Exception as e:
        print(f"❌ Error: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    generate_sql_from_json()
