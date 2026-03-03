import frappe

@frappe.whitelist()
def get_od_values(range_of_size):
    return frappe.db.sql_list("""
        SELECT DISTINCT od 
        FROM `tabDie Details` 
        WHERE range_of_size = %s 
        ORDER BY od
    """, range_of_size)

@frappe.whitelist()
def get_id_values(range_of_size):
    return frappe.db.sql_list("""
        SELECT DISTINCT id 
        FROM `tabDie Details` 
        WHERE range_of_size = %s 
        ORDER BY id
    """, range_of_size)

@frappe.whitelist()
def pressure(od, id, length, material_pressure, moulding_press_mc):
    p = frappe.db.get_value('Asset', moulding_press_mc, 'custom_pressure')
    
    od = float(od)
    id = float(id)
    material_pressure = float(material_pressure)
    p = float(p)
    
    return (pow(od, 2) - pow(id, 2)) * 0.786 / 100 * material_pressure / p


@frappe.whitelist()
def weight(od, id, length, density):
    od = float(od)
    id = float(id)
    length = float(length)
    density = float(density)
    
    calculated_weight = (pow(od, 2) - pow(id, 2)) * 0.786 * length * density / 100000
    
    return round(calculated_weight, 3)

# @frappe.whitelist()
# def update_work_order_qty(work_order_name, qty_value):
#     """Update Work Order qty and recalculate required_items"""
#     wo = frappe.get_doc("Work Order", work_order_name)
#     new_qty = float(qty_value)
    
#     wo.qty = new_qty
    
#     # Recalculate required_items from BOM
#     if wo.bom_no and wo.required_items:
#         bom_items = {i.item_code: i.qty for i in frappe.get_doc("BOM", wo.bom_no).items}
#         for item in wo.required_items:
#             if item.item_code in bom_items:
#                 item.required_qty = bom_items[item.item_code] * new_qty
#                 item.amount = item.required_qty * (item.rate or 0)
    
#     wo.flags.ignore_validate_update_after_submit = True
#     wo.save(ignore_permissions=True)
#     frappe.db.commit()


def set_job_numbers(doc, method):
    if not doc.production_plan:
        return

    if doc.get('custom_job_number'):
        return

    sales_orders = frappe.db.get_all(
        'Production Plan Sales Order',
        filters={'parent': doc.production_plan},
        fields=['sales_order', 'custom_job_number'],
        order_by='idx asc'
    )

    for row in sales_orders:
        if row.get('sales_order') and row.get('custom_job_number'):
            doc.append('custom_job_number', {
                'sales_order': row['sales_order'],
                'job_number': row['custom_job_number']
            })