import pandas as pd
import sys

def analyze_excel_structure(input_file):
    try:
        xl = pd.ExcelFile(input_file, engine='openpyxl')
        print(f"Hojas encontradas: {xl.sheet_names}")
        
        for sheet in xl.sheet_names:
            print(f"\n--- Analizando hoja: {sheet} ---")
            df = pd.read_excel(input_file, sheet_name=sheet, engine='openpyxl')
            print(f"Dimensiones: {df.shape}")
            print("Primeras 10 filas (cabecera incluida):")
            print(df.head(10).to_string())
            
            # Intentar encontrar columnas que parezcan de inventario
            potential_cols = [c for c in df.columns if any(k in str(c).lower() for k in ['prod', 'nom', 'prec', 'val', 'stock', 'cant'])]
            if potential_cols:
                print(f"Columnas con potencial: {potential_cols}")
                
    except Exception as e:
        print(f"Error: {e}")
        sys.exit(1)

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Uso: python script.py <input_xlsm>")
        sys.exit(1)
    analyze_excel_structure(sys.argv[1])
