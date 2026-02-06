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


@frappe.whitelist()
def update_work_order_qty(work_order_name, qty_value):
    """Update Work Order qty field"""
    work_order = frappe.get_doc("Work Order", work_order_name)
    work_order.qty = float(qty_value)
    work_order.flags.ignore_validate_update_after_submit = True
    work_order.save(ignore_permissions=True)
    frappe.db.commit()