import frappe
import urllib.parse
from frappe.utils import get_url

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


# def set_job_numbers(doc, method):
#     if not doc.production_plan:
#         return

#     if doc.get('custom_job_number'):
#         return

#     sales_orders = frappe.db.get_all(
#         'Production Plan Sales Order',
#         filters={'parent': doc.production_plan},
#         fields=['sales_order', 'custom_job_number'],
#         order_by='idx asc'
#     )

#     valid_rows = [
#         row for row in sales_orders
#         if row.get('sales_order') and row.get('custom_job_number')
#     ]

#     if not valid_rows:
#         return

#     for row in valid_rows:
#         doc.append('custom_job_number', {
#             'sales_orders': row['sales_order'],
#             'job_number': row['custom_job_number']
#         })

#     if doc.get('production_plan_sub_assembly_item') and doc.get('sales_order'):
#         doc.sales_order = None

def set_job_number_from_pp(doc, method=None):
    if not doc.get("production_plan_item"):
        return

    if doc.get("custom_job_number"):
        return

    row = frappe.db.get_value(
        "Production Plan Item",
        doc.production_plan_item,
        ["sales_order", "sales_order_item", "custom_job_number"],
        as_dict=True,
    )
    if not row or not row.sales_order:
        return

    job_number = row.custom_job_number

    if not job_number and row.sales_order_item:
        job_number = frappe.db.get_value(
            "Sales Order Item", row.sales_order_item, "custom_job_number"
        )

    doc.append("custom_job_number", {
        "sales_orders": row.sales_order,
        "job_number": job_number or "",
    })

@frappe.whitelist()
def generate_work_order_qr_code(work_order_name):
    try:
        if not work_order_name:
            frappe.throw("Work Order name is required")

        base_url = get_url()
        redirect_to = f"/app/work-order/{urllib.parse.quote(str(work_order_name))}"
        full_url = f"{base_url}{redirect_to}"

        encoded_url = urllib.parse.quote(full_url, safe='')
        qr_image_url = f"https://api.qrserver.com/v1/create-qr-code/?size=220x220&data={encoded_url}"

        frappe.db.set_value(
            "Work Order",
            work_order_name,
            "custom_production_qr_image",
            qr_image_url,
            update_modified=False
        )
        frappe.db.commit()

        return {
            "work_order_qr": qr_image_url,
            "work_order_name": work_order_name
        }

    except Exception as e:
        frappe.log_error(f"Error generating QR code for Work Order {work_order_name}: {str(e)}")
        frappe.throw(f"Failed to generate QR code: {str(e)}")


from frappe import _
from frappe.utils import flt

@frappe.whitelist()
def rework_manufacture_entry(work_order, rework_qty, quality_inspection=None, stock_entry=None):
    rework_qty = flt(rework_qty)
    if rework_qty <= 0:
        frappe.throw(_("Rework Qty must be greater than 0"))

    if stock_entry:
        se_name = stock_entry
    else:
        se_name = frappe.db.get_value(
            "Stock Entry",
            {"work_order": work_order, "purpose": "Manufacture", "docstatus": 1},
            "name",
            order_by="creation desc",
        )
    if not se_name:
        frappe.throw(_("No submitted Manufacture Stock Entry found for {0}").format(work_order))

    old = frappe.get_doc("Stock Entry", se_name)
    fg_qty = flt(old.fg_completed_qty)
    if rework_qty >= fg_qty:
        frappe.throw(_("Rework Qty must be less than Manufactured Qty ({0})").format(fg_qty))

    old.cancel()

    new = frappe.copy_doc(old)
    new.fg_completed_qty = fg_qty - rework_qty
    for row in new.items:
        if row.is_finished_item:
            row.qty = flt(row.qty) - rework_qty
            row.transfer_qty = flt(row.qty) * flt(row.conversion_factor or 1)
            row.quality_inspection = None
    new.insert()
    new.submit()

    if quality_inspection:
        frappe.db.set_value("Quality Inspection", quality_inspection, "custom_rework_qty", rework_qty)
    else:
        frappe.db.set_value("Work Order", work_order, "custom_rework_qty", rework_qty)

    frappe.db.set_value("Work Order", work_order, "custom_machining_completed", 0)

    return new.name