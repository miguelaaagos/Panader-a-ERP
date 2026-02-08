import json
from supabase import create_client, Client
import os
from dotenv import load_dotenv

# Nota: El usuario debe proporcionar estas variables si no están configuradas.
# Como es un POS local, asumimos que están en .env después de la config de Next.js
load_dotenv()

url = os.environ.get("NEXT_PUBLIC_SUPABASE_URL")
key = os.environ.get("SUPABASE_SERVICE_ROLE_KEY") # Necesitamos Service Role para saltar RLS en carga masiva

if not url or not key:
    print("Error: NEXT_PUBLIC_SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY deben estar en el .env")
    exit(1)

supabase: Client = create_client(url, key)

def upload_data():
    try:
        with open("inventario_consolidado.json", "r", encoding="utf-8") as f:
            data = json.load(f)

        # 1. Cargar Categorías
        print("Cargando categorías...")
        categorias_db = []
        for cat in data["categorias"]:
            res = supabase.table("categorias").upsert({"nombre": cat}, on_conflict="nombre").execute()
            categorias_db.append(res.data[0])
        
        # Mapa de nombres a IDs
        cat_map = {c["nombre"]: c["id"] for c in categorias_db}
        default_cat_id = categorias_db[0]["id"] if categorias_db else None

        # 2. Cargar Productos
        print(f"Cargando {len(data['productos'])} productos...")
        productos_to_insert = []
        for p in data["productos"]:
            # Intentamos adivinar la categoría por el nombre (simplificado)
            cat_id = default_cat_id
            name_lower = p["nombre"].lower()
            if "bebida" in name_lower or "coca" in name_lower or "nectar" in name_lower:
                cat_id = cat_map.get("Bebidas", default_cat_id)
            elif "queque" in name_lower or "pan" in name_lower:
                cat_id = cat_map.get("Panadería", default_cat_id)
            
            # Limpieza de código de barras (quitar 'escanear codigo' si existe)
            barcode = p["codigo_barras"] if p["codigo_barras"] != "escanear codigo" else None

            productos_to_insert.append({
                "codigo_barras": barcode,
                "nombre": p["nombre"],
                "descripcion": f"Producto importado de Excel: {p['nombre']}",
                "categoria_id": cat_id,
                "precio_costo": p["precio_costo"],
                "margen_porcentaje": p["margen_porcentaje"],
                "stock_cantidad": p["stock_cantidad"],
                "es_pesable": p["es_pesable"]
            })

        # Insertamos en lotes de 50 para evitar límites
        for i in range(0, len(productos_to_insert), 50):
            batch = productos_to_insert[i:i+50]
            supabase.table("productos").upsert(batch, on_conflict="nombre").execute()
        
        print("Éxito: Datos cargados correctamente en Supabase.")

    except Exception as e:
        print(f"Error durante la carga: {e}")

if __name__ == "__main__":
    upload_data()
