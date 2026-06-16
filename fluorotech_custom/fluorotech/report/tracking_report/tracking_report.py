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
        # ── ORDER / JOB INFO ──────────────────────────────────────────────
        {
            "label": _("Job No"),
            "fieldname": "job_no",
            "fieldtype": "Data",
            "width": 120
        },
        {
            "label": _("Rejection / Part Qty"),
            "fieldname": "rejection_part_qty",
            "fieldtype": "Float",
            "width": 140
        },
        {
            "label": _("PO Enter Date"),
            "fieldname": "po_enter_date",
            "fieldtype": "Date",
            "width": 110
        },
        {
            "label": _("Development / Production"),
            "fieldname": "dev_or_production",
            "fieldtype": "Data",
            "width": 150
        },
        {
            "label": _("Customer"),
            "fieldname": "customer",
            "fieldtype": "Link",
            "options": "Customer",
            "width": 150
        },
        {
            "label": _("PO No"),
            "fieldname": "po_no",
            "fieldtype": "Data",
            "width": 120
        },
        {
            "label": _("PO Date"),
            "fieldname": "po_date",
            "fieldtype": "Date",
            "width": 100
        },
        {
            "label": _("Item Code / Description"),
            "fieldname": "item_code",
            "fieldtype": "Link",
            "options": "Item",
            "width": 160
        },
        {
            "label": _("Drawing Number"),
            "fieldname": "drawing_number",
            "fieldtype": "Data",
            "width": 130
        },
        {
            "label": _("Dwg No. Avail/Not"),
            "fieldname": "dwg_available",
            "fieldtype": "Data",
            "width": 130
        },
        {
            "label": _("Order Qty"),
            "fieldname": "order_qty",
            "fieldtype": "Float",
            "width": 90
        },
        {
            "label": _("Finish Stock Qty"),
            "fieldname": "finish_stock_qty",
            "fieldtype": "Float",
            "width": 120
        },
        {
            "label": _("Quality Accepted Qty"),
            "fieldname": "quality_accepted_qty",
            "fieldtype": "Float",
            "width": 140
        },
        {
            "label": _("Finish Stock Rejected Qty"),
            "fieldname": "finish_stock_rejected_qty",
            "fieldtype": "Float",
            "width": 170
        },
        {
            "label": _("Moulding Qty"),
            "fieldname": "moulding_qty",
            "fieldtype": "Float",
            "width": 110
        },
        {
            "label": _("Material"),
            "fieldname": "material",
            "fieldtype": "Data",
            "width": 120
        },
        {
            "label": _("OD"),
            "fieldname": "od",
            "fieldtype": "Float",
            "width": 70
        },
        {
            "label": _("ID"),
            "fieldname": "id",
            "fieldtype": "Float",
            "width": 70
        },
        {
            "label": _("Length"),
            "fieldname": "length",
            "fieldtype": "Float",
            "width": 80
        },
        {
            "label": _("Width"),
            "fieldname": "width",
            "fieldtype": "Float",
            "width": 80
        },
        {
            "label": _("Delivery Date"),
            "fieldname": "delivery_date",
            "fieldtype": "Date",
            "width": 110
        },
        {
            "label": _("No of Days for Dispatch"),
            "fieldname": "no_of_days_for_dispatch",
            "fieldtype": "Int",
            "width": 160
        },
        {
            "label": _("Rate per Piece"),
            "fieldname": "rate_per_piece",
            "fieldtype": "Currency",
            "width": 120
        },
        {
            "label": _("Total Cost"),
            "fieldname": "total_cost",
            "fieldtype": "Currency",
            "width": 110
        },

        # ── MOULDING ─────────────────────────────────────────────────────
        {
            "label": _("Production Plan No"),
            "fieldname": "production_plan_no",
            "fieldtype": "Data",
            "width": 140
        },
        {
            "label": _("Moulding Production Plan Date"),
            "fieldname": "moulding_production_plan_date",
            "fieldtype": "Date",
            "width": 190
        },
        {
            "label": _("Moulding Date"),
            "fieldname": "moulding_date",
            "fieldtype": "Date",
            "width": 120
        },
        {
            "label": _("Press No"),
            "fieldname": "press_no",
            "fieldtype": "Data",
            "width": 90
        },
        {
            "label": _("Moulding Job Card No"),
            "fieldname": "moulding_job_card_no",
            "fieldtype": "Data",
            "width": 160
        },
        {
            "label": _("Batch No"),
            "fieldname": "batch_no",
            "fieldtype": "Data",
            "width": 100
        },
        {
            "label": _("Moulding Qty Produced"),
            "fieldname": "moulding_qty_produced",
            "fieldtype": "Float",
            "width": 160
        },
        {
            "label": _("Moulding Qty Rejected"),
            "fieldname": "moulding_qty_rejected",
            "fieldtype": "Float",
            "width": 160
        },
        {
            "label": _("Moulding Qty Accepted"),
            "fieldname": "moulding_qty_accepted",
            "fieldtype": "Float",
            "width": 160
        },

        # ── SINTERING ────────────────────────────────────────────────────
        {
            "label": _("Sintering Plan Date"),
            "fieldname": "sintering_plan_date",
            "fieldtype": "Date",
            "width": 140
        },
        {
            "label": _("Sintering Done Date"),
            "fieldname": "sintering_done_date",
            "fieldtype": "Date",
            "width": 140
        },
        {
            "label": _("Sintering Oven No"),
            "fieldname": "sintering_oven_no",
            "fieldtype": "Data",
            "width": 130
        },
        {
            "label": _("Sintering Qty Produced"),
            "fieldname": "sintering_qty_produced",
            "fieldtype": "Float",
            "width": 160
        },
        {
            "label": _("Sintering Qty Rejected"),
            "fieldname": "sintering_qty_rejected",
            "fieldtype": "Float",
            "width": 160
        },
        {
            "label": _("Sintering Qty Accepted"),
            "fieldname": "sintering_qty_accepted",
            "fieldtype": "Float",
            "width": 160
        },
        {
            "label": _("Sintering Rejection Reason"),
            "fieldname": "sintering_rejection_reason",
            "fieldtype": "Data",
            "width": 180
        },

        # ── STRAIGHTENING ────────────────────────────────────────────────
        {
            "label": _("Straightening Plan Date"),
            "fieldname": "straightening_plan_date",
            "fieldtype": "Date",
            "width": 170
        },
        {
            "label": _("Straightening Done Date"),
            "fieldname": "straightening_done_date",
            "fieldtype": "Date",
            "width": 170
        },
        {
            "label": _("Straightening Oven No"),
            "fieldname": "straightening_oven_no",
            "fieldtype": "Data",
            "width": 160
        },
        {
            "label": _("Straightening Qty Produced"),
            "fieldname": "straightening_qty_produced",
            "fieldtype": "Float",
            "width": 185
        },
        {
            "label": _("Straightening Qty Rejected"),
            "fieldname": "straightening_qty_rejected",
            "fieldtype": "Float",
            "width": 185
        },
        {
            "label": _("Straightening Qty Accepted"),
            "fieldname": "straightening_qty_accepted",
            "fieldtype": "Float",
            "width": 185
        },
        {
            "label": _("Straightening Rejection Reason"),
            "fieldname": "straightening_rejection_reason",
            "fieldtype": "Data",
            "width": 200
        },

        # ── STAGE INSPECTION ─────────────────────────────────────────────
        {
            "label": _("Observed OD"),
            "fieldname": "observed_od",
            "fieldtype": "Float",
            "width": 110
        },
        {
            "label": _("Observed ID"),
            "fieldname": "observed_id",
            "fieldtype": "Float",
            "width": 110
        },
        {
            "label": _("Observed Length"),
            "fieldname": "observed_length",
            "fieldtype": "Float",
            "width": 130
        },
        {
            "label": _("Accepted Qty"),
            "fieldname": "stage_accepted_qty",
            "fieldtype": "Float",
            "width": 110
        },
        {
            "label": _("Rejected Qty"),
            "fieldname": "stage_rejected_qty",
            "fieldtype": "Float",
            "width": 110
        },
        {
            "label": _("Stage Rejection Reason"),
            "fieldname": "stage_rejection_reason",
            "fieldtype": "Data",
            "width": 170
        },
        {
            "label": _("Material Movement (Challan No.)"),
            "fieldname": "challan_no",
            "fieldtype": "Data",
            "width": 200
        },

        # ── LATHE ────────────────────────────────────────────────────────
        {
            "label": _("Lathe Production Plan Date"),
            "fieldname": "lathe_production_plan_date",
            "fieldtype": "Date",
            "width": 180
        },
        {
            "label": _("Lathe Production Date"),
            "fieldname": "lathe_production_date",
            "fieldtype": "Date",
            "width": 150
        },
        {
            "label": _("Lathe Job Card No"),
            "fieldname": "lathe_job_card_no",
            "fieldtype": "Data",
            "width": 140
        },
        {
            "label": _("Lathe Machine No"),
            "fieldname": "lathe_machine_no",
            "fieldtype": "Data",
            "width": 130
        },
        {
            "label": _("Lathe Qty Produced"),
            "fieldname": "lathe_qty_produced",
            "fieldtype": "Float",
            "width": 140
        },
        {
            "label": _("Lathe Qty Rejected"),
            "fieldname": "lathe_qty_rejected",
            "fieldtype": "Float",
            "width": 140
        },
        {
            "label": _("Lathe Qty Accepted"),
            "fieldname": "lathe_qty_accepted",
            "fieldtype": "Float",
            "width": 140
        },
        {
            "label": _("Lathe Rejection Reason"),
            "fieldname": "lathe_rejection_reason",
            "fieldtype": "Data",
            "width": 160
        },

        # ── CNC ──────────────────────────────────────────────────────────
        {
            "label": _("CNC Production Plan Date"),
            "fieldname": "cnc_production_plan_date",
            "fieldtype": "Date",
            "width": 175
        },
        {
            "label": _("CNC Production Date"),
            "fieldname": "cnc_production_date",
            "fieldtype": "Date",
            "width": 150
        },
        {
            "label": _("CNC Job Card No"),
            "fieldname": "cnc_job_card_no",
            "fieldtype": "Data",
            "width": 140
        },
        {
            "label": _("CNC Machine No"),
            "fieldname": "cnc_machine_no",
            "fieldtype": "Data",
            "width": 130
        },
        {
            "label": _("CNC Qty Produced"),
            "fieldname": "cnc_qty_produced",
            "fieldtype": "Float",
            "width": 130
        },
        {
            "label": _("CNC Qty Rejected"),
            "fieldname": "cnc_qty_rejected",
            "fieldtype": "Float",
            "width": 130
        },
        {
            "label": _("CNC Qty Accepted"),
            "fieldname": "cnc_qty_accepted",
            "fieldtype": "Float",
            "width": 130
        },
        {
            "label": _("CNC Rejection Reason"),
            "fieldname": "cnc_rejection_reason",
            "fieldtype": "Data",
            "width": 160
        },

        # ── VNC ──────────────────────────────────────────────────────────
        {
            "label": _("VNC Production Plan Date"),
            "fieldname": "vnc_production_plan_date",
            "fieldtype": "Date",
            "width": 175
        },
        {
            "label": _("VNC Production Date"),
            "fieldname": "vnc_production_date",
            "fieldtype": "Date",
            "width": 150
        },
        {
            "label": _("VNC Job Card No"),
            "fieldname": "vnc_job_card_no",
            "fieldtype": "Data",
            "width": 140
        },
        {
            "label": _("VNC Machine No"),
            "fieldname": "vnc_machine_no",
            "fieldtype": "Data",
            "width": 130
        },
        {
            "label": _("VNC Qty Produced"),
            "fieldname": "vnc_qty_produced",
            "fieldtype": "Float",
            "width": 130
        },
        {
            "label": _("VNC Qty Rejected"),
            "fieldname": "vnc_qty_rejected",
            "fieldtype": "Float",
            "width": 130
        },
        {
            "label": _("VNC Qty Accepted"),
            "fieldname": "vnc_qty_accepted",
            "fieldtype": "Float",
            "width": 130
        },
        {
            "label": _("VNC Rejection Reason"),
            "fieldname": "vnc_rejection_reason",
            "fieldtype": "Data",
            "width": 160
        },

        # ── FINAL INSPECTION ─────────────────────────────────────────────
        {
            "label": _("FG Material Received Date"),
            "fieldname": "fg_material_received_date",
            "fieldtype": "Date",
            "width": 175
        },
        {
            "label": _("Material Inspection Date"),
            "fieldname": "material_inspection_date",
            "fieldtype": "Date",
            "width": 170
        },
        {
            "label": _("Quantity Inspected"),
            "fieldname": "quantity_inspected",
            "fieldtype": "Float",
            "width": 140
        },
        {
            "label": _("Final Qty Rejected"),
            "fieldname": "final_qty_rejected",
            "fieldtype": "Float",
            "width": 140
        },
        {
            "label": _("Final Qty Accepted"),
            "fieldname": "final_qty_accepted",
            "fieldtype": "Float",
            "width": 140
        },
        {
            "label": _("% Rejection"),
            "fieldname": "percent_rejection",
            "fieldtype": "Percent",
            "width": 110
        },
        {
            "label": _("Cost of Rejection"),
            "fieldname": "cost_of_rejection",
            "fieldtype": "Currency",
            "width": 140
        },
        {
            "label": _("Inspected By"),
            "fieldname": "inspected_by",
            "fieldtype": "Data",
            "width": 130
        },

        # ── DISPATCH ─────────────────────────────────────────────────────
        {
            "label": _("PDI No"),
            "fieldname": "pdi_no",
            "fieldtype": "Data",
            "width": 100
        },
        {
            "label": _("Invoice No"),
            "fieldname": "invoice_no",
            "fieldtype": "Data",
            "width": 120
        },
        {
            "label": _("Invoice Date"),
            "fieldname": "invoice_date",
            "fieldtype": "Date",
            "width": 110
        },
        {
            "label": _("Quantity Dispatched"),
            "fieldname": "quantity_dispatched",
            "fieldtype": "Float",
            "width": 150
        },
        {
            "label": _("DN Number"),
            "fieldname": "dn_number",
            "fieldtype": "Data",
            "width": 110
        },
        {
            "label": _("Delivery Rating"),
            "fieldname": "delivery_rating",
            "fieldtype": "Data",
            "width": 120
        },
        {
            "label": _("Work Order"),
            "fieldname": "work_order_id",
            "fieldtype": "Link",
            "options": "Work Order",
            "width": 160
        },
    ]


def get_sintering_straightening_select():
    """
    Returns the SELECT expressions for Sintering and Straightening
    from the custom_process_tracking child table (Process CT doctype).
    
    Process CT fields:
        process_ct      -> process name (e.g. 'Sintering', 'Straightening')
        date            -> date of process
        qty_produced    -> qty produced
        rejection_qty   -> qty rejected
        qty_accepted    -> qty accepted
        remark          -> rejection reason
        completed       -> check (1/0)
        rejected        -> check (1/0)
    
    parentfield = 'custom_process_tracking'  <-- THIS was the missing piece
    parenttype  = 'Work Order'
    """
    sintering = """
        wo_sint.date                                        AS sintering_plan_date,
        DATE_ADD(wo_sint.date, INTERVAL 1 DAY)             AS sintering_done_date,
        wo.custom_oven_no                                   AS sintering_oven_no,
        wo_sint.qty_produced                               AS sintering_qty_produced,
        wo_sint.rejection_qty                              AS sintering_qty_rejected,
        wo_sint.qty_accepted                               AS sintering_qty_accepted,
        wo_sint.remark                                     AS sintering_rejection_reason"""

    straightening = """
        wo_str.date                                        AS straightening_plan_date,
        DATE_ADD(wo_str.date, INTERVAL 1 DAY)             AS straightening_done_date,
        wo.custom_oven_no                                  AS straightening_oven_no,
        wo_str.qty_produced                               AS straightening_qty_produced,
        wo_str.rejection_qty                              AS straightening_qty_rejected,
        wo_str.qty_accepted                               AS straightening_qty_accepted,
        wo_str.remark                                     AS straightening_rejection_reason"""

    return sintering, straightening


def get_process_ct_joins():
    """
    Returns the LEFT JOIN clauses for Sintering and Straightening.

    KEY FIX:  Add  AND wo_sint.parentfield = 'custom_process_tracking'
              This ensures we only read from the correct child table field,
              not from any other Process CT usage.
    """
    return """
        LEFT JOIN `tabProcess CT` wo_sint
            ON wo_sint.parent      = wo.name
            AND wo_sint.parentfield = 'custom_process_tracking'
            AND wo_sint.process_ct  = 'Sintering'
        LEFT JOIN `tabProcess CT` wo_str
            ON wo_str.parent       = wo.name
            AND wo_str.parentfield  = 'custom_process_tracking'
            AND wo_str.process_ct   = 'Straightening'
    """


def get_data(filters):
    conditions = ""
    values = {}

    if filters.get("customer"):
        conditions += " AND so.customer = %(customer)s"
        values["customer"] = filters["customer"]

    if filters.get("item_code"):
        conditions += " AND ppi.item_code = %(item_code)s"
        values["item_code"] = filters["item_code"]

    if filters.get("dev_or_production"):
        conditions += " AND soi.custom_type = %(dev_or_production)s"
        values["dev_or_production"] = filters["dev_or_production"]

    if filters.get("job_no"):
        conditions += " AND soi.custom_job_number = %(job_no)s"
        values["job_no"] = filters["job_no"]

    if filters.get("po_no"):
        conditions += " AND so.po_no = %(po_no)s"
        values["po_no"] = filters["po_no"]

    if filters.get("delivery_date"):
        conditions += " AND so.delivery_date = %(delivery_date)s"
        values["delivery_date"] = filters["delivery_date"]

    if filters.get("from_date"):
        conditions += " AND so.transaction_date >= %(from_date)s"
        values["from_date"] = filters["from_date"]

    if filters.get("to_date"):
        conditions += " AND so.transaction_date <= %(to_date)s"
        values["to_date"] = filters["to_date"]

    sint_select, str_select = get_sintering_straightening_select()
    process_joins = get_process_ct_joins()

    query1 = """
        SELECT
            soi.custom_job_number                               AS job_no,
            so.transaction_date                                 AS po_enter_date,
            soi.custom_type                                     AS dev_or_production,
            so.customer                                         AS customer,
            ppi.item_code                                       AS item_code,
            soi.qty                                             AS order_qty,
            so.po_no                                            AS po_no,
            so.po_date                                          AS po_date,
            soi.custom_od                                       AS od,
            soi.custom_id                                       AS id,
            soi.custom_length                                   AS length,
            soi.custom_width                                    AS width,
            soi.custom_drawing_no                               AS drawing_number,
            so.delivery_date                                    AS delivery_date,
            soi.rate                                            AS rate_per_piece,
            soi.amount                                          AS total_cost,
            NULL                                                AS rejection_part_qty,
            NULL                                                AS dwg_available,
            NULL                                                AS finish_stock_qty,
            NULL                                                AS quality_accepted_qty,
            NULL                                                AS finish_stock_rejected_qty,
            NULL                                                AS moulding_qty,
            soi.custom_combine_material_name                    AS material,
            NULL                                                AS no_of_days_for_dispatch,
            ppi.parent                                          AS production_plan_no,
            wo.custom_moulding_completed_date                   AS moulding_production_plan_date,
            DATE_ADD(wo.custom_moulding_completed_date, INTERVAL 1 DAY) AS moulding_date,
            wo.custom_mounlding_press_mc                        AS press_no,
            NULL                                                AS moulding_job_card_no,
            (SELECT woi.custom_batch_display 
             FROM `tabWork Order Item` woi 
             WHERE woi.parent = wo.name 
             LIMIT 1)                                           AS batch_no,
            NULL                                                AS moulding_qty_produced,
            NULL                                                AS moulding_qty_rejected,
            NULL                                                AS moulding_qty_accepted,
            {sint_select},
            {str_select},
            NULL AS observed_od,
            NULL AS observed_id,
            NULL AS observed_length,
            NULL AS stage_accepted_qty,
            NULL AS stage_rejected_qty,
            NULL AS stage_rejection_reason,
            NULL AS challan_no,
            wo.custom_lathe_date                                AS lathe_production_plan_date,
            DATE_ADD(wo.custom_lathe_date, INTERVAL 1 DAY)     AS lathe_production_date,
            NULL AS lathe_job_card_no,
            NULL AS lathe_machine_no,
            NULL AS lathe_qty_produced,
            NULL AS lathe_qty_rejected,
            NULL AS lathe_qty_accepted,
            NULL AS lathe_rejection_reason,
            wo.custom_cnc_date                                  AS cnc_production_plan_date,
            DATE_ADD(wo.custom_cnc_date, INTERVAL 1 DAY)       AS cnc_production_date,
            NULL AS cnc_job_card_no,
            NULL AS cnc_machine_no,
            NULL AS cnc_qty_produced,
            NULL AS cnc_qty_rejected,
            NULL AS cnc_qty_accepted,
            NULL AS cnc_rejection_reason,
            wo.custom_vmc_date                                  AS vnc_production_plan_date,
            DATE_ADD(wo.custom_vmc_date, INTERVAL 1 DAY)       AS vnc_production_date,
            NULL AS vnc_job_card_no,
            NULL AS vnc_machine_no,
            NULL AS vnc_qty_produced,
            NULL AS vnc_qty_rejected,
            NULL AS vnc_qty_accepted,
            NULL AS vnc_rejection_reason,
            NULL AS fg_material_received_date,
            NULL AS material_inspection_date,
            NULL AS quantity_inspected,
            NULL AS final_qty_rejected,
            NULL AS final_qty_accepted,
            NULL AS percent_rejection,
            NULL AS cost_of_rejection,
            NULL AS inspected_by,
            NULL AS pdi_no,
            NULL AS invoice_no,
            NULL AS invoice_date,
            NULL AS quantity_dispatched,
            NULL AS dn_number,
            NULL AS delivery_rating,
            wo.name                                             AS work_order_id
        FROM
            `tabProduction Plan Item` ppi
        INNER JOIN `tabSales Order`      so  ON so.name  = ppi.sales_order
        INNER JOIN `tabSales Order Item` soi ON soi.name = ppi.sales_order_item
        LEFT  JOIN `tabWork Order`       wo
            ON  wo.production_plan      = ppi.parent
            AND wo.production_plan_item = ppi.name
        {process_joins}
        WHERE
            so.docstatus = 1
            {conditions}
    """.format(
        sint_select=sint_select,
        str_select=str_select,
        process_joins=process_joins,
        conditions=conditions
    )

    query2 = """
        SELECT
            soi.custom_job_number                               AS job_no,
            so.transaction_date                                 AS po_enter_date,
            soi.custom_type                                     AS dev_or_production,
            so.customer                                         AS customer,
            ppsa.production_item                                AS item_code,
            soi.qty                                             AS order_qty,
            so.po_no                                            AS po_no,
            so.po_date                                          AS po_date,
            soi.custom_od                                       AS od,
            soi.custom_id                                       AS id,
            soi.custom_length                                   AS length,
            soi.custom_width                                    AS width,
            soi.custom_drawing_no                               AS drawing_number,
            so.delivery_date                                    AS delivery_date,
            soi.rate                                            AS rate_per_piece,
            soi.amount                                          AS total_cost,
            NULL                                                AS rejection_part_qty,
            NULL                                                AS dwg_available,
            NULL                                                AS finish_stock_qty,
            NULL                                                AS quality_accepted_qty,
            NULL                                                AS finish_stock_rejected_qty,
            NULL                                                AS moulding_qty,
            soi.custom_combine_material_name                    AS material,
            NULL                                                AS no_of_days_for_dispatch,
            ppi.parent                                          AS production_plan_no,
            wo.custom_moulding_completed_date                   AS moulding_production_plan_date,
            DATE_ADD(wo.custom_moulding_completed_date, INTERVAL 1 DAY) AS moulding_date,
            wo.custom_mounlding_press_mc                        AS press_no,
            NULL                                                AS moulding_job_card_no,
            (SELECT woi.custom_batch_display 
             FROM `tabWork Order Item` woi 
             WHERE woi.parent = wo.name 
             LIMIT 1)                                           AS batch_no,
            NULL                                                AS moulding_qty_produced,
            NULL                                                AS moulding_qty_rejected,
            NULL                                                AS moulding_qty_accepted,
            {sint_select},
            {str_select},
            NULL AS observed_od,
            NULL AS observed_id,
            NULL AS observed_length,
            NULL AS stage_accepted_qty,
            NULL AS stage_rejected_qty,
            NULL AS stage_rejection_reason,
            NULL AS challan_no,
            wo.custom_lathe_date                                AS lathe_production_plan_date,
            DATE_ADD(wo.custom_lathe_date, INTERVAL 1 DAY)     AS lathe_production_date,
            NULL AS lathe_job_card_no,
            NULL AS lathe_machine_no,
            NULL AS lathe_qty_produced,
            NULL AS lathe_qty_rejected,
            NULL AS lathe_qty_accepted,
            NULL AS lathe_rejection_reason,
            wo.custom_cnc_date                                  AS cnc_production_plan_date,
            DATE_ADD(wo.custom_cnc_date, INTERVAL 1 DAY)       AS cnc_production_date,
            NULL AS cnc_job_card_no,
            NULL AS cnc_machine_no,
            NULL AS cnc_qty_produced,
            NULL AS cnc_qty_rejected,
            NULL AS cnc_qty_accepted,
            NULL AS cnc_rejection_reason,
            wo.custom_vmc_date                                  AS vnc_production_plan_date,
            DATE_ADD(wo.custom_vmc_date, INTERVAL 1 DAY)       AS vnc_production_date,
            NULL AS vnc_job_card_no,
            NULL AS vnc_machine_no,
            NULL AS vnc_qty_produced,
            NULL AS vnc_qty_rejected,
            NULL AS vnc_qty_accepted,
            NULL AS vnc_rejection_reason,
            NULL AS fg_material_received_date,
            NULL AS material_inspection_date,
            NULL AS quantity_inspected,
            NULL AS final_qty_rejected,
            NULL AS final_qty_accepted,
            NULL AS percent_rejection,
            NULL AS cost_of_rejection,
            NULL AS inspected_by,
            NULL AS pdi_no,
            NULL AS invoice_no,
            NULL AS invoice_date,
            NULL AS quantity_dispatched,
            NULL AS dn_number,
            NULL AS delivery_rating,
            wo.name                                             AS work_order_id
        FROM
            `tabProduction Plan Item` ppi
        INNER JOIN `tabSales Order`      so   ON so.name   = ppi.sales_order
        INNER JOIN `tabSales Order Item` soi  ON soi.name  = ppi.sales_order_item
        INNER JOIN `tabProduction Plan Sub Assembly Item` ppsa
            ON  ppsa.parent                = ppi.parent
            AND ppsa.production_plan_item  = ppi.name
        LEFT  JOIN `tabWork Order`       wo
            ON  wo.production_plan                    = ppi.parent
            AND wo.production_plan_sub_assembly_item  = ppsa.name
        {process_joins}
        WHERE
            so.docstatus = 1
            {conditions}
    """.format(
        sint_select=sint_select,
        str_select=str_select,
        process_joins=process_joins,
        conditions=conditions
    )

    full_sql = """
        {q1}
        UNION ALL
        {q2}
        ORDER BY
            po_enter_date DESC, production_plan_no, job_no
    """.format(q1=query1, q2=query2)

    data = frappe.db.sql(full_sql, values, as_dict=1)
    return data