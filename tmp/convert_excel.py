import pandas as pd
import sys

def convert_xlsm_to_csv(input_file, output_file):
    try:
        # Intentamos leer el archivo xlsm
        df = pd.read_excel(input_file, engine='openpyxl')
        # Guardamos como csv
        df.to_csv(output_file, index=False, encoding='utf-8')
        print(f"Conversión exitosa: {output_file}")
        # Mostramos las primeras filas para inspección
        print("\nColumnas encontradas:")
        print(df.columns.tolist())
        print("\nPrimeras 5 filas:")
        print(df.head().to_string())
    except Exception as e:
        print(f"Error: {e}")
        sys.exit(1)

if __name__ == "__main__":
    if len(sys.argv) < 3:
        print("Uso: python script.py <input_xlsm> <output_csv>")
        sys.exit(1)
    convert_xlsm_to_csv(sys.argv[1], sys.argv[2])
