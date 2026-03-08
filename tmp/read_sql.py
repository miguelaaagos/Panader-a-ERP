import sys

def read_sql(file_path):
    # Probar codificaciones comunes para archivos generados por redirección en Windows
    for encoding in ['utf-16', 'utf-16-le', 'utf-8', 'latin-1']:
        try:
            with open(file_path, 'r', encoding=encoding) as f:
                content = f.read()
                if len(content) > 10: # Validar que no sea basura
                    return content
        except:
            continue
    return None

if __name__ == "__main__":
    content = read_sql(sys.argv[1])
    if content:
        print(content)
    else:
        sys.exit(1)
