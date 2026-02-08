import json
from supabase import create_client, Client
import os
from dotenv import load_dotenv

load_dotenv()

url = os.environ.get("NEXT_PUBLIC_SUPABASE_URL")
key = os.environ.get("SUPABASE_SERVICE_ROLE_KEY")

if not url or not key:
    print("❌ Error: NEXT_PUBLIC_SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY deben estar en el .env")
    print("   Por favor, agrega tu Service Role Key desde el Dashboard de Supabase:")
    print("   Settings > API > service_role key")
    exit(1)

supabase: Client = create_client(url, key)

def upload_data():
    try:
        with open("inventario_consolidado.json", "r", encoding="utf-8") as f:
            data = json.load(f)

        # 1. Limpiar productos existentes (opcional - comentar si quieres mantener datos)
        print("🗑️  Limpiando productos existentes...")
        supabase.table("productos").delete().neq("id", "00000000-0000-0000-0000-000000000000").execute()
        
        # 2. Cargar Categorías
        print("📂 Cargando categorías...")
        categorias_db = []
        for cat in data["categorias"]:
            res = supabase.table("categorias").upsert({"nombre": cat}, on_conflict="nombre").execute()
            categorias_db.append(res.data[0])
        
        # Mapa de nombres a IDs
        cat_map = {c["nombre"]: c["id"] for c in categorias_db}
        default_cat_id = categorias_db[0]["id"] if categorias_db else None

        # 3. Cargar Productos
        print(f"📦 Cargando {len(data['productos'])} productos...")
        productos_to_insert = []
        
        for p in data["productos"]:
            # Categorización inteligente
            cat_id = default_cat_id
            name_lower = p["nombre"].lower()
            
            if any(kw in name_lower for kw in ["bebida", "coca", "nectar", "jugo", "agua", "sprite", "fanta"]):
                cat_id = cat_map.get("Bebidas", default_cat_id)
            elif any(kw in name_lower for kw in ["queque", "pan", "hallulla", "marraqueta", "dobladita"]):
                cat_id = cat_map.get("Panadería", default_cat_id)
            elif any(kw in name_lower for kw in ["chocolate", "dulce", "caramelo", "galleta"]):
                cat_id = cat_map.get("Confitería", default_cat_id)
            
            # Limpieza de código de barras
            barcode = p["codigo_barras"] if p.get("codigo_barras") else None
            
            # IMPORTANTE: Usamos precio_venta directamente del Excel
            # El trigger de la DB ya no lo calculará si viene con valor
            productos_to_insert.append({
                "codigo_barras": barcode,
                "nombre": p["nombre"],
                "descripcion": f"Producto importado de Excel",
                "categoria_id": cat_id,
                "precio_costo": p.get("precio_costo", 0),
                "margen_porcentaje": p.get("margen_porcentaje", 0.5),
                "precio_venta": p.get("precio_venta", 0),  # ← Precio directo del Excel
                "stock_cantidad": p.get("stock_cantidad", 0),
                "es_pesable": p.get("es_pesable", False)
            })

        # Insertamos en lotes de 50
        total_inserted = 0
        for i in range(0, len(productos_to_insert), 50):
            batch = productos_to_insert[i:i+50]
            result = supabase.table("productos").insert(batch).execute()
            total_inserted += len(result.data)
            print(f"  ✓ Insertados {total_inserted}/{len(productos_to_insert)} productos...")
        
        print(f"\n✅ Éxito: {total_inserted} productos cargados correctamente en Supabase")
        print(f"\n🔍 Verifica en el Dashboard de Supabase > Table Editor > productos")

    except Exception as e:
        print(f"❌ Error durante la carga: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    print("=" * 60)
    print("🚀 CARGA DE PRODUCTOS A SUPABASE")
    print("=" * 60)
    upload_data()
