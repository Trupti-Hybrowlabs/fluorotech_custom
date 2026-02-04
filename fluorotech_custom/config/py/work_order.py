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
    
    return (pow(od, 2) - pow(id, 2)) * 0.786 * length * density / 100000


