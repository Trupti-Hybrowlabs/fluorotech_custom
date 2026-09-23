import frappe
from frappe import _, bold
from frappe.utils import get_link_to_form, flt
from erpnext.manufacturing.doctype.job_card.job_card import JobCard as ERPNextJobCard


class CustomJobCard(ERPNextJobCard):

    def validate(self):
        super().validate()
        self.set_customer_and_po_from_work_order()

    def set_customer_and_po_from_work_order(self):
        if not self.work_order:
            return

        job_number_row = frappe.get_all(
            "Job Number CT",
            filters={"parent": self.work_order, "parenttype": "Work Order"},
            fields=["sales_orders"],
            order_by="idx asc",
            limit=1,
        )

        if not job_number_row or not job_number_row[0].sales_orders:
            return

        sales_order = job_number_row[0].sales_orders

        so_data = frappe.db.get_value(
            "Sales Order", sales_order, ["customer", "po_no"], as_dict=True
        )

        if so_data:
            self.custom_customer = so_data.customer
            self.custom_po_no = so_data.po_no

    def validate_job_card(self):
        if self.work_order and frappe.get_cached_value("Work Order", self.work_order, "status") == "Stopped":
            frappe.throw(
                _("Transaction not allowed against stopped Work Order {0}").format(
                    get_link_to_form("Work Order", self.work_order)
                )
            )

        if frappe.db.get_single_value("Manufacturing Settings", "enforce_time_logs"):
            for row in self.time_logs or []:
                if not row.from_time or not row.to_time:
                    frappe.throw(
                        _("Row #{0}: From Time and To Time fields are required").format(row.idx),
                    )

        precision = self.precision("total_completed_qty")
        total_completed_qty = flt(
            flt(self.total_completed_qty, precision) + flt(self.process_loss_qty, precision)
        )

        if self.for_quantity and flt(total_completed_qty, precision) != flt(self.for_quantity, precision):
            frappe.throw(
                _("The {0} ({1}) must be equal to {2} ({3})").format(
                    bold(_("Total Completed Qty")),
                    bold(flt(total_completed_qty, precision)),
                    bold(_("Qty to Manufacture")),
                    bold(self.for_quantity),
                )
            )