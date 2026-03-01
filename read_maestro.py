import openpyxl

filename = "06_REGISTRO_VENTAS(VERSION FINAL).xlsm"
wb = openpyxl.load_workbook(filename, data_only=True)
sheet = wb['MAESTRO DE PRODUCTOS']

for r in range(1, 40): # Read more rows to catch headers and some products
    row = [str(sheet.cell(row=r, column=c).value or "") for c in range(1, 25)]
    if any(row):
        print(" | ".join(row))
