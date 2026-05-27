# Copyright (c) 2026, Trupti Ninghot and contributors
# For license information, please see license.txt

import frappe
from frappe import _


def execute(filters=None):
    columns = get_columns()
    data = get_data(filters)
    return columns, data


def get_columns():
    return [
        {
            "fieldname": "stock_entry_id",
            "label": _("Stock Entry ID"),
            "fieldtype": "Link",
            "options": "Stock Entry",
            "width": 160
        },
        {
            "fieldname": "work_order",
            "label": _("Work Order"),
            "fieldtype": "Link",
            "options": "Work Order",
            "width": 180
        },
        {
            "fieldname": "item_code",
            "label": _("Item Code"),
            "fieldtype": "Link",
            "options": "Item",
            "width": 150
        },
        {
            "fieldname": "item_name",
            "label": _("Item Name"),
            "fieldtype": "Data",
            "width": 200
        },
        {
            "fieldname": "qty",
            "label": _("Qty"),
            "fieldtype": "Float",
            "width": 100
        },
        {
            "fieldname": "uom",
            "label": _("UOM"),
            "fieldtype": "Data",
            "width": 80
        },
        {
            "fieldname": "stock_entry_type",
            "label": _("Stock Entry Type"),
            "fieldtype": "Data",
            "width": 200
        },
        {
            "fieldname": "posting_date",
            "label": _("Date"),
            "fieldtype": "Date",
            "width": 150
        }
    ]


def get_data(filters):
    conditions = get_conditions(filters)

    data = frappe.db.sql(
        """
        SELECT
            se.name                   AS stock_entry_id,
            se.work_order             AS work_order,
            sed.item_code             AS item_code,
            sed.item_name             AS item_name,
            sed.qty                   AS qty,
            sed.uom                   AS uom,
            se.stock_entry_type       AS stock_entry_type,
            se.posting_date           AS posting_date
        FROM
            `tabStock Entry` se
        INNER JOIN
            `tabStock Entry Detail` sed ON sed.parent = se.name
        WHERE
            se.docstatus != 2
            {conditions}
        ORDER BY
            se.creation DESC
        """.format(conditions=conditions),
        filters,
        as_dict=1
    )

    return data


def get_conditions(filters):
    conditions = ""

    conditions += " AND se.stock_entry_type IN ('Material Transfer for Manufacture', 'Manufacture')"

    if filters.get("from_date"):
        conditions += " AND se.posting_date >= %(from_date)s"

    if filters.get("to_date"):
        conditions += " AND se.posting_date <= %(to_date)s"

    if filters.get("work_order"):
        conditions += " AND se.work_order = %(work_order)s"

    if filters.get("item_code"):
        conditions += " AND sed.item_code = %(item_code)s"

    if filters.get("stock_entry_type"):
        conditions += " AND se.stock_entry_type = %(stock_entry_type)s"

    return conditions