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
            "fieldname": "production_plan",
            "label": _("Production Plan"),
            "fieldtype": "Link",
            "options": "Production Plan",
            "width": 180
        },
         {
            "fieldname": "sales_order",
            "label": _("Sales Order"),
            "fieldtype": "Link",
            "options": "Sales Order",
            "width": 180
        },
        {
            "fieldname": "work_order",
            "label": _("Work Order"),
            "fieldtype": "Link",
            "options": "Work Order",
            "width": 180
        },
        {
            "fieldname": "customer",
            "label": _("Customer"),
            "fieldtype": "Link",
            "options": "Customer",
            "width": 200
        },
        {
            "fieldname": "stock_entry_id",
            "label": _("Stock Entry ID"),
            "fieldtype": "Link",
            "options": "Stock Entry",
            "width": 160
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
            "fieldname": "planned_qty",
            "label": _("Planned Qty"),
            "fieldtype": "Float",
            "width": 120
        },
        {
            "fieldname": "wo_qty",
            "label": _("Qty To Manufacture"),
            "fieldtype": "Float",
            "width": 120
        },
       
        {
            "fieldname": "qty",
            "label": _("Manufactured Qty"),
            "fieldtype": "Float",
            "width": 100
        },
        {
            "fieldname": "rejection_qty",
            "label": _("Rejection Qty"),
            "fieldtype": "Float",
            "width": 120
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
        },
        {
            "fieldname": "moulding_press_mc",
            "label": _("Moulding Press Mc"),
            "fieldtype": "Link",
            "options": "Asset",
            "width": 160
        },
        {
            "fieldname": "job_no",
            "label": _("Job No"),
            "fieldtype": "Link",
            "options": "Job Card",
            "width": 160
        },
        {
            "fieldname": "reason",
            "label": _("Reason"),
            "fieldtype": "Data",
            "width": 200
        },
    ]


def get_data(filters):
    conditions = get_conditions(filters)

    data = frappe.db.sql(
        """
        SELECT
            se.name                       AS stock_entry_id,
            se.work_order                 AS work_order,
            wo.qty                        AS wo_qty,
            wo.production_plan            AS production_plan,
            pp_so.sales_order             AS sales_order,
            pp_so.customer                AS customer,
            pp_item.planned_qty           AS planned_qty,
            sed.item_code                 AS item_code,
            sed.item_name                 AS item_name,
            sed.qty                       AS qty,
            sed.uom                       AS uom,
            se.stock_entry_type           AS stock_entry_type,
            se.posting_date               AS posting_date,
            wo.custom_mounlding_press_mc  AS moulding_press_mc,
            jc.job_card_no                AS job_no,
            CASE
                WHEN sed.item_code = wo.production_item
                THEN COALESCE(pt.total_rejection_qty, 0)
                ELSE NULL
            END                           AS rejection_qty,
            CASE
                WHEN sed.item_code = wo.production_item
                THEN pt.remarks
                ELSE NULL
            END                           AS reason
        FROM
            `tabStock Entry` se
        INNER JOIN
            `tabStock Entry Detail` sed ON sed.parent = se.name
        LEFT JOIN
            `tabWork Order` wo ON wo.name = se.work_order
        LEFT JOIN (
            SELECT
                parent,
                GROUP_CONCAT(DISTINCT sales_order ORDER BY sales_order SEPARATOR ', ') AS sales_order,
                GROUP_CONCAT(DISTINCT customer ORDER BY customer SEPARATOR ', ')       AS customer
            FROM
                `tabProduction Plan Sales Order`
            WHERE
                sales_order IS NOT NULL AND sales_order != ''
            GROUP BY
                parent
        ) pp_so ON pp_so.parent = wo.production_plan
        LEFT JOIN (
            SELECT
                parent,
                item_code,
                SUM(planned_qty) AS planned_qty
            FROM
                `tabProduction Plan Item`
            GROUP BY
                parent, item_code
        ) pp_item ON pp_item.parent = wo.production_plan
                  AND pp_item.item_code = wo.production_item
        LEFT JOIN (
            SELECT
                parent,
                SUM(rejection_qty)                                            AS total_rejection_qty,
                GROUP_CONCAT(remark ORDER BY idx SEPARATOR ' | ')            AS remarks
            FROM
                `tabProcess CT`
            WHERE
                rejection_qty > 0
            GROUP BY
                parent
        ) pt ON pt.parent = se.work_order
        LEFT JOIN (
            SELECT
                work_order,
                GROUP_CONCAT(DISTINCT name ORDER BY creation SEPARATOR ', ') AS job_card_no
            FROM
                `tabJob Card`
            WHERE
                docstatus != 2
            GROUP BY
                work_order
        ) jc ON jc.work_order = se.work_order
        WHERE
            se.docstatus = 1
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