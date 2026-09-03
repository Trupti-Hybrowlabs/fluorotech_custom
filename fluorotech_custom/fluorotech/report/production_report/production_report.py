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
            "fieldname": "stock_entry_type",
            "label": _("Stock Entry Type"),
            "fieldtype": "Data",
            "width": 200
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
        #  {
        #     "fieldname": "wo_qty",
        #     "label": _("Planned Qty"),
        #     "fieldtype": "Float",
        #     "width": 120
        # },
        {
            "fieldname": "wo_qty",
            "label": _("Qty To Manufacture"),
            "fieldtype": "Float",
            "width": 120
        },
       
        # {
        #     "fieldname": "qty",
        #     "label": _("Manufactured Qty"),
        #     "fieldtype": "Float",
        #     "width": 100
        # },
        # {
        #     "fieldname": "uom",
        #     "label": _("UOM"),
        #     "fieldtype": "Data",
        #     "width": 80
        # },
        
        # {
        #     "fieldname": "posting_date",
        #     "label": _("Stock Entry Date"),
        #     "fieldtype": "Date",
        #     "width": 150
        # },

        # {
        #     "fieldname": "posting_time",
        #     "label": _("Time"),
        #     "fieldtype": "Time",
        #     "width": 120
        # },
        {
            "fieldname": "production_date_ct",
            "label": _("Production Date"),
            "fieldtype": "Date",
            "width": 130
        },
        {
            "fieldname": "production_qty",
            "label": _("Production Qty"),
            "fieldtype": "Float",
            "width": 120
        },
        {
            "fieldname": "rejection_qty",
            "label": _("Rejection Qty"),
            "fieldtype": "Float",
            "width": 120
        },
        {
            "fieldname": "moulding_press_mc",
            "label": _("Moulding Press Mc"),
            "fieldtype": "Link",
            "options": "Asset",
            "width": 160
        },
        # {
        #     "fieldname": "job_no",
        #     "label": _("Job No"),
        #     "fieldtype": "Link",
        #     "options": "Job Card",
        #     "width": 160
        # },
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
            se.posting_time               AS posting_time,
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
        WHERE
            se.docstatus = 1
            {conditions}
        ORDER BY
            se.creation DESC
        """.format(conditions=conditions),
        filters,
        as_dict=1
    )

    work_orders = list(set([d.work_order for d in data if d.work_order]))
    production_dates_map = {}

    if work_orders:
        production_data = frappe.db.sql(
            """
            SELECT
                parent,
                production_date,
                accepted_qty,
                rejected_qty
            FROM
                `tabDaily Production CT`
            WHERE
                parent IN %(work_orders)s
            ORDER BY
                parent, idx
            """,
            {"work_orders": work_orders},
            as_dict=1
        )

        for pd in production_data:
            production_dates_map.setdefault(pd.parent, []).append(
                {"production_date": pd.production_date, "production_qty": pd.accepted_qty, "rejection_qty": pd.rejected_qty}
            )

    final_data = []
    for row in data:
        entries = production_dates_map.get(row.work_order, [])

        if not entries:
            row["production_date_ct"] = None
            row["production_qty"] = None
            row["rejection_qty"] = None
            final_data.append(row)
        else:
            for idx, entry in enumerate(entries):
                if idx == 0:
                    row["production_date_ct"] = entry["production_date"]
                    row["production_qty"] = entry["production_qty"]
                    row["rejection_qty"] = entry["rejection_qty"]
                    final_data.append(row)
                else:
                    blank_row = {
                        "production_date_ct": entry["production_date"],
                        "production_qty": entry["production_qty"],
                        "rejection_qty": entry["rejection_qty"]
                    }
                    final_data.append(blank_row)

    return final_data


def get_conditions(filters):
    conditions = ""

    conditions += " AND se.stock_entry_type = 'Manufacture'"

    if filters.get("from_date"):
        conditions += " AND se.posting_date >= %(from_date)s"

    if filters.get("to_date"):
        conditions += " AND se.posting_date <= %(to_date)s"

    if filters.get("work_order"):
        conditions += " AND se.work_order = %(work_order)s"

    if filters.get("item_code"):
        conditions += " AND sed.item_code = %(item_code)s"

    return conditions