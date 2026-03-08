import pandas as pd
import json
import sys

def clean_float(value):
    try:
        if pd.isna(value): return 0.0
        # Eliminar cualquier caracter no numérico excepto el punto decimal
        clean_val = "".join(c for c in str(value) if c.isdigit() or c in '.-')
        if not clean_val or clean_val == '-': return 0.0
        return float(clean_val)
    except:
        return 0.0

def extract_inventory(input_file):
    try:
        # Forzar lectura de columnas como string inicialmente para evitar problemas de tipos mixtos
        df = pd.read_excel(input_file, sheet_name='PRODUCTOS VENTA', engine='openpyxl')
        
        # Filtrar solo si tiene detalle (nombre)
        df = df.dropna(subset=['DETALLE'])
        
        products = []
        for _, row in df.iterrows():
            nombre = str(row['DETALLE']).strip()
            if not nombre or nombre.lower() == "nan": continue
            
            # Unidad de medida
            unidad_raw = str(row.get('UND', 'unidades')).lower()
            unidad = "unidades"
            if "kg" in unidad_raw: unidad = "kg"
            elif "gr" in unidad_raw or "g" in unidad_raw: unidad = "g"
            elif "cc" in unidad_raw or "ml" in unidad_raw: unidad = "ml"
            elif "lt" in unidad_raw or "l" in unidad_raw: unidad = "L"
            
            product = {
                "nombre": nombre,
                "codigo_barras": str(row.get('CODIGO', '')) if pd.notna(row.get('CODIGO')) else None,
                "precio_venta": clean_float(row.get('PRECIO VENTA', 0)),
                "precio_compra": clean_float(row.get('COSTO\n(bruto)', 0)),
                "stock_actual": clean_float(row.get('INVENTARIO', 0)),
                "stock_minimo": 0,
                "unidad_medida": unidad,
                "tipo": "producto_terminado",
                "activo": True
            }
            # Evitar productos sin nombre real (ej: solo espacios)
            if len(product["nombre"]) > 2:
                products.append(product)
            
        print(json.dumps(products, indent=2, ensure_ascii=False))
        
    except Exception as e:
        sys.stderr.write(f"Error: {e}\n")
        sys.exit(1)

if __name__ == "__main__":
    extract_inventory(sys.argv[1])
