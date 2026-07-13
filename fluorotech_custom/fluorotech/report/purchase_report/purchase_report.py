# Copyright (c) 2026, Trupti Ninghot and contributors
# For license information, please see license.txt

import frappe
from frappe import _


def execute(filters=None):
    if not filters:
        filters = {}

    columns = get_columns()
    data = get_data(filters)
    return columns, data


def get_columns():
    return [
        {
            "label": _("Supplier Name"),
            "fieldname": "supplier_name",
            "fieldtype": "Data",
            "width": 180
        },
        {
            "label": _("Description"),
            "fieldname": "description",
            "fieldtype": "Data",
            "width": 220
        },
        {
            "label": _("Rate"),
            "fieldname": "rate",
            "fieldtype": "Currency",
            "width": 100
        },
        {
            "label": _("PO No"),
            "fieldname": "po_no",
            "fieldtype": "Link",
            "options": "Purchase Order",
            "width": 200
        },
        {
            "label": _("PO Date"),
            "fieldname": "po_date",
            "fieldtype": "Date",
            "width": 140
        },
        {
            "label": _("Received Date"),
            "fieldname": "received_date",
            "fieldtype": "Date",
            "width": 120
        },
        {
            "label": _("GRN No"),
            "fieldname": "grn_no",
            "fieldtype": "Link",
            "options": "Purchase Receipt",
            "width": 140
        },
        {
            "label": _("GRN Date"),
            "fieldname": "grn_date",
            "fieldtype": "Date",
            "width": 100
        },
        {
            "label": _("Invoice No"),
            "fieldname": "invoice_no",
            "fieldtype": "Data",
            "width": 140
        },
		{
			"label": _("SDR"),
			"fieldname": "sdr",
			"fieldtype": "Data",
			"width": 120
		},
    ]


def get_data(filters):
    conditions = ""
    values = {}

    if filters.get("supplier"):
        conditions += " AND po.supplier = %(supplier)s"
        values["supplier"] = filters["supplier"]

    if filters.get("po_no"):
        conditions += " AND po.name = %(po_no)s"
        values["po_no"] = filters["po_no"]

    if filters.get("from_date"):
        conditions += " AND po.transaction_date >= %(from_date)s"
        values["from_date"] = filters["from_date"]

    if filters.get("to_date"):
        conditions += " AND po.transaction_date <= %(to_date)s"
        values["to_date"] = filters["to_date"]

    query = """
        SELECT
            po.supplier_name                    AS supplier_name,
            poi.description                     AS description,
            poi.rate                             AS rate,
            po.name                              AS po_no,
            po.transaction_date                  AS po_date,
            pr.posting_date                      AS received_date,
            pr.name                              AS grn_no,
            pr.posting_date                      AS grn_date,
            pr.supplier_delivery_note            AS invoice_no,
			NULL                                  AS sdr
        FROM `tabPurchase Order Item` poi
        INNER JOIN `tabPurchase Order` po
            ON po.name = poi.parent
        LEFT JOIN `tabPurchase Receipt Item` pri
            ON pri.purchase_order_item = poi.name
        LEFT JOIN `tabPurchase Receipt` pr
            ON pr.name = pri.parent
            AND pr.docstatus = 1
        WHERE
            po.docstatus = 1
            {conditions}
        ORDER BY
            po.transaction_date DESC, po.name
    """.format(conditions=conditions)

    data = frappe.db.sql(query, values, as_dict=1)
    return data