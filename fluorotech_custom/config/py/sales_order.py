import frappe
@frappe.whitelist()
def get_last_job_number():
    result = frappe.db.sql("""
        SELECT MAX(CAST(custom_job_number AS UNSIGNED)) as last_no
        FROM `tabSales Order Item`
        WHERE custom_job_number != '' AND custom_job_number IS NOT NULL
    """, as_dict=True)
    
    return result[0].last_no if result and result[0].last_no else 10000