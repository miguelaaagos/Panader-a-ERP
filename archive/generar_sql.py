import json
import re

def slugify(text):
    text = text.lower()
    text = re.sub(r'[^\w\s-]', '', text)
    text = re.sub(r'[-\s]+', '-', text).strip('-')
    return text

def generate_sql():
    try:
        with open("inventario_consolidado.json", "r", encoding="utf-8") as f:
            data = json.load(f)

        sql_lines = []
        
        # 1. Insertar Categorías con Slugs
        sql_lines.append("-- Insertar Categorías")
        for cat in data["categorias"]:
            slug = slugify(cat)
            sql_lines.append(f"INSERT INTO categorias (nombre, slug) VALUES ('{cat}', '{slug}') ON CONFLICT (nombre) DO UPDATE SET slug = EXCLUDED.slug;")
        
        sql_lines.append("\n-- Insertar Productos (Con conflicto en codigo_barras)")
        for p in data["productos"]:
            name = p["nombre"].replace("'", "''")
            barcode = p["codigo_barras"] if p["codigo_barras"] != "escanear codigo" else None
            
            # Solo usamos ON CONFLICT si tenemos código de barras (que es único)
            if barcode:
                sql_lines.append(
                    f"INSERT INTO productos (codigo_barras, nombre, categoria_id, precio_costo, margen_porcentaje, stock_cantidad, es_pesable) "
                    f"VALUES ('{barcode}', '{name}', (SELECT id FROM categorias WHERE nombre = (CASE WHEN '{name}' ILIKE '%pan%' OR '{name}' ILIKE '%hallulla%' OR '{name}' ILIKE '%marraqueta%' THEN 'Panadería' WHEN '{name}' ILIKE '%bebida%' OR '{name}' ILIKE '%coca%' OR '{name}' ILIKE '%jugo%' THEN 'Bebidas' WHEN '{name}' ILIKE '%torta%' OR '{name}' ILIKE '%dulce%' THEN 'Confitería' ELSE 'Abarrotes' END) LIMIT 1), {p['precio_costo']}, {p['margen_porcentaje']}, {p['stock_cantidad']}, {p['es_pesable']}) "
                    f"ON CONFLICT (codigo_barras) DO UPDATE SET stock_cantidad = EXCLUDED.stock_cantidad, precio_costo = EXCLUDED.precio_costo, nombre = EXCLUDED.nombre;"
                )
            else:
                # Si no hay código de barras, inserción simple (asumimos que el nombre podría duplicarse pero no hay constraint única en nombre)
                sql_lines.append(
                    f"INSERT INTO productos (nombre, categoria_id, precio_costo, margen_porcentaje, stock_cantidad, es_pesable) "
                    f"VALUES ('{name}', (SELECT id FROM categorias WHERE nombre = 'Abarrotes' LIMIT 1), {p['precio_costo']}, {p['margen_porcentaje']}, {p['stock_cantidad']}, {p['es_pesable']});"
                )

        with open("carga_inicial.sql", "w", encoding="utf-8") as f:
            f.write("\n".join(sql_lines))
        
        print("Éxito: Archivo carga_inicial.sql generado correctamente con resolución de conflictos por código de barras.")

    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    generate_sql()
