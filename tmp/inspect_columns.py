import pandas as pd
import sys

def analyze_sheet(input_file):
    try:
        df = pd.read_excel(input_file, sheet_name='PRODUCTOS VENTA', engine='openpyxl')
        print(f"Nombres de columnas reales: {df.columns.tolist()}")
        print("\nPrimeras 5 filas completas:")
        print(df.head(5).to_string())
    except Exception as e:
        print(f"Error: {e}")
        sys.exit(1)

if __name__ == "__main__":
    analyze_sheet(sys.argv[1])
