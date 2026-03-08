import pandas as pd
import json
import sys

def extract_inventory(input_file):
    try:
        df = pd.read_excel(input_file, sheet_name='PRODUCTOS VENTA', engine='openpyxl')
        
        # Filtrar solo si tiene detalle (nombre)
        df = df.dropna(subset=['DETALLE'])
        
        products = []
        for _, row in df.iterrows():
            # Mapeo según inspección previa
            nombre = str(row['DETALLE']).strip()
            if not nombre or nombre == "nan": continue
            
            # Unidad de medida (normalizar a lo que permite el enum si es posible, o dejar como 'unidades')
            unidad_raw = str(row.get('UND', 'unidades')).lower()
            unidad = "unidades"
            if "kg" in unidad_raw: unidad = "kg"
            elif "gr" in unidad_raw or "g" in unidad_raw: unidad = "g"
            elif "cc" in unidad_raw or "ml" in unidad_raw: unidad = "ml"
            elif "lt" in unidad_raw or "l" in unidad_raw: unidad = "L"
            
            product = {
                "nombre": nombre,
                "codigo_barras": str(row.get('CODIGO', '')) if pd.notna(row.get('CODIGO')) else None,
                "precio_venta": float(row.get('PRECIO VENTA', 0)),
                "precio_compra": float(row.get('COSTO\n(bruto)', 0)) if pd.notna(row.get('COSTO\n(bruto)')) else 0,
                "stock_actual": float(row.get('INVENTARIO', 0)) if pd.notna(row.get('INVENTARIO')) else 0,
                "stock_minimo": 0,
                "unidad_medida": unidad,
                "tipo": "producto_terminado",
                "activo": True
            }
            products.append(product)
            
        print(json.dumps(products, indent=2, ensure_ascii=False))
        
    except Exception as e:
        # Imprimir error a stderr para no manchar el JSON
        sys.stderr.write(f"Error: {e}\n")
        sys.exit(1)

if __name__ == "__main__":
    extract_inventory(sys.argv[1])
