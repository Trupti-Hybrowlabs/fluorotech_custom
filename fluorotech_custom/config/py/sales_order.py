import frappe

@frappe.whitelist()
def get_job_number_from_so(sales_order, item_code):
    result = frappe.db.sql("""
        SELECT custom_job_number, custom_pos_no
        FROM `tabSales Order Item` 
        WHERE parent = %s AND item_code = %s
        LIMIT 1
    """, (sales_order, item_code), as_dict=True)
    
    return result[0] if result else None