import frappe

@frappe.whitelist()
def get_job_number_from_so(sales_order, item_code):
    result = frappe.db.get_value(
        'Sales Order Item',
        {'parent': sales_order, 'item_code': item_code},
        ['custom_job_number', 'custom_pos_no'],
        as_dict=True
    )
    return result or {}