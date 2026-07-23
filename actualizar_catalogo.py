import os
import json
import shutil
import time
import openpyxl

def sync_catalog():
    excel_path = "catalogo_mikado.xlsx"
    images_dir = "imagenes_productos"
    output_json = "products.json"
    output_js = "products.js"
    root_logo = "logo.png"

    print("==================================================")
    print("      MIKADO SKINCARE - SYNC SYSTEM v2.0         ")
    print("==================================================")

    # 1. Check & Sync Brand Logo (Supports PNG, WEBP, JPG, JPEG, SVG, AVIF)
    logo_updated = False
    logo_candidates = [
        os.path.join(images_dir, "logo.webp"),
        os.path.join(images_dir, "logo.png"),
        os.path.join(images_dir, "logo.jpg"),
        os.path.join(images_dir, "logo.jpeg"),
        os.path.join(images_dir, "logo.svg"),
        os.path.join(images_dir, "logo.avif"),
        os.path.join(images_dir, "LOGO.webp"),
        os.path.join(images_dir, "LOGO.png"),
        os.path.join(images_dir, "LOGO.jpg")
    ]

    for logo_path in logo_candidates:
        if os.path.exists(logo_path):
            try:
                shutil.copy(logo_path, root_logo)
                logo_updated = True
                print(f"[LOGO] Sincronizado exitosamente desde: '{logo_path}' -> '{root_logo}'")
                break
            except Exception as e:
                print(f"[LOGO Warning] No se pudo copiar el logo: {e}")

    if not logo_updated and os.path.exists(root_logo):
        print(f"[LOGO] Usando logo existente en la raiz: '{root_logo}'")
    elif not logo_updated:
        print(f"[LOGO Notice] Coloca 'logo.webp', 'logo.png' o 'logo.jpg' en la carpeta '{images_dir}' para actualizar el logo de la marca.")

    # 2. Check Excel File
    if not os.path.exists(excel_path):
        print(f"\n[ERROR] No se encontró el archivo Excel '{excel_path}'")
        return

    if not os.path.exists(images_dir):
        os.makedirs(images_dir, exist_ok=True)
        print(f"\n[INFO] Creada la carpeta '{images_dir}'")

    # 3. Read Catalog Data from Excel
    wb = openpyxl.load_workbook(excel_path, data_only=True)
    ws = wb.active

    products = []
    custom_images_count = 0
    total_stock_units = 0

    # Read row by row (skipping header row 1)
    for idx, row in enumerate(ws.iter_rows(min_row=2, values_only=True), start=1):
        if not row or not any(row):
            continue

        codigo = str(row[0]).strip() if row[0] else f"MKD-{idx:03d}"
        marca = str(row[1]).strip() if row[1] else "Mikado"
        producto = str(row[2]).strip() if row[2] else "Producto K-Beauty"
        categoria = str(row[3]).strip().lower() if row[3] else "otros"
        
        try:
            precio = float(row[4]) if row[4] is not None else 0.0
        except (ValueError, TypeError):
            precio = 0.0

        try:
            stock = int(row[5]) if row[5] is not None else 0
        except (ValueError, TypeError):
            stock = 0

        try:
            descuento = float(row[6]) if row[6] is not None else 0.0
        except (ValueError, TypeError):
            descuento = 0.0

        descripcion = str(row[7]).strip() if len(row) > 7 and row[7] else ""

        total_stock_units += stock

        # Calculate discounted price if applicable
        old_price = None
        current_price = precio
        if descuento > 0:
            if descuento < 1.0: # Percent format (e.g. 0.15 = 15%)
                old_price = precio
                current_price = round(precio * (1 - descuento), 2)
            else: # Direct S/ discount
                old_price = precio
                current_price = round(precio - descuento, 2)

        # 4. Check for SKU Image in imagenes_productos/ folder (WEBP, PNG, JPG, JPEG, AVIF, GIF)
        image_path = None
        extensions = [
            ".webp", ".png", ".jpg", ".jpeg", ".avif", ".gif",
            ".WEBP", ".PNG", ".JPG", ".JPEG", ".AVIF", ".GIF"
        ]
        for ext in extensions:
            candidate = os.path.join(images_dir, f"{codigo}{ext}")
            if os.path.exists(candidate):
                image_path = f"imagenes_productos/{codigo}{ext}"
                custom_images_count += 1
                break

        # Fallback path if image file not present yet
        if not image_path:
            image_path = f"imagenes_productos/{codigo}.png"

        product_obj = {
            "id": idx,
            "codigo": codigo,
            "brand": marca,
            "title": producto,
            "category": categoria,
            "price": current_price,
            "oldPrice": old_price,
            "stock": stock,
            "discount": descuento,
            "badge": "En Stock" if stock > 0 else "Agotado",
            "badgeClass": "sale" if old_price else ("accent" if stock > 0 else ""),
            "img": image_path,
            "desc": descripcion or "Producto coreano de alta calidad importado de Seúl."
        }

        products.append(product_obj)

    # 5. Output Data Files with Timestamp (for cache invalidation)
    timestamp = int(time.time())

    with open(output_json, "w", encoding="utf-8") as f:
        json.dump(products, f, ensure_ascii=False, indent=2)

    js_content = f"""// Auto-generated catalog from {excel_path}
const CATALOG_TIMESTAMP = {timestamp};
const PRODUCTS_DATA = {json.dumps(products, ensure_ascii=False, indent=2)};
"""

    with open(output_js, "w", encoding="utf-8") as f:
        f.write(js_content)

    print("\n--------------------------------------------------")
    print(f" [RESULTADOS DE LA SINCRONIZACION]")
    print(f" -> Productos procesados: {len(products)}")
    print(f" -> Imagenes custom encontradas: {custom_images_count} / {len(products)}")
    print(f" -> Stock total registrado: {total_stock_units} unidades")
    print(f" -> Base de datos JSON: '{output_json}'")
    print(f" -> Conector Web JS: '{output_js}'")
    print("--------------------------------------------------")
    print(" STATUS: Sincronizacion completa con exito.")
    print("==================================================\n")

if __name__ == "__main__":
    sync_catalog()
