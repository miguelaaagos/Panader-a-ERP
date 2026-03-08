import pandas as pd
import json
import sys

def extract_inventory(input_file):
    try:
        df = pd.read_excel(input_file, sheet_name='PRODUCTOS VENTA', engine='openpyxl')
        
        # Limpiar filas vacías (donde PRODUCTO sea NaN)
        df = df.dropna(subset=['PRODUCTO'])
        
        # Mapeo de columnas (Asegurar que existan o poner defaults)
        # Columnas detectadas: ['PRODUCTO', 'Unidad', 'Categoría', 'PRECIO COMPRA', 'PRECIO VENTA']
        
        products = []
        for _, row in df.iterrows():
            product = {
                "nombre": str(row['PRODUCTO']).strip(),
                "precio_venta": float(row.get('PRECIO VENTA', 0)),
                "precio_compra": float(row.get('PRECIO COMPRA', 0)),
                "stock_actual": 0, # Se inicializa en 0 para luego entrar via ingresos
                "stock_minimo": 0,
                "unidad_medida": str(row.get('Unidad', 'unidades')).lower(),
                "tipo": "producto_terminado", # Asumimos esto para el POS
                "activo": True
            }
            products.append(product)
            
        print(json.dumps(products, indent=2, ensure_ascii=False))
        
    except Exception as e:
        print(f"Error: {e}")
        sys.exit(1)

if __name__ == "__main__":
    extract_inventory(sys.argv[1])
