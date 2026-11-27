# Copyright (c) 2026, Trupti Ninghot and contributors
# For license information, please see license.txt

import frappe
from frappe import _
from frappe.model.document import Document
from frappe.utils import flt, now_datetime
from pypika.terms import ExistsCriterion

from erpnext.manufacturing.doctype.work_order.work_order import get_item_details

SOURCE_WAREHOUSE = "Finish Stock Store – FEPL"
TARGET_WAREHOUSE = "Under Quality Inspection - FEPL"


class FinishStock(Document):
	# ---------- Step 1: Get Sales Orders ----------
	@frappe.whitelist()
	def get_open_sales_orders(self):
		if not self.item_to_transfer:
			frappe.throw(_("Please select Item To Transfer first"))

		bom = frappe.qb.DocType("BOM")
		so = frappe.qb.DocType("Sales Order")
		so_item = frappe.qb.DocType("Sales Order Item")
		item = frappe.qb.DocType("Item")

		bom_subquery = (
			frappe.qb.from_(bom)
			.from_(item)
			.select(bom.name)
			.where(
				(item.name == so_item.item_code)
				& bom.item.isin([item.name, item.variant_of])
				& (bom.is_active == 1)
			)
		)

		query = (
			frappe.qb.from_(so)
			.from_(so_item)
			.select(so.name, so.transaction_date, so.customer, so.base_grand_total)
			.distinct()
			.where(
				(so_item.parent == so.name)
				& (so.docstatus == 1)
				& (so.status.notin(["Stopped", "Closed"]))
				& (so_item.item_code == self.item_to_transfer)
				& (so_item.qty > so_item.production_plan_qty)
				& ExistsCriterion(bom_subquery)
			)
		)

		if self.get("company"):
			query = query.where(so.company == self.company)

		open_so = query.run(as_dict=True)

		self.set("sales_orders", [])
		for d in open_so:
			self.append(
				"sales_orders",
				{
					"sales_order": d.name,
					"sales_order_date": d.transaction_date,
					"customer": d.customer,
					"grand_total": d.base_grand_total,
				},
			)

		if not open_so:
			frappe.msgprint(_("Sales orders are not available for production"))

	# ---------- Step 2: Get Finished Goods for Manufacture ----------
	@frappe.whitelist()
	def get_finished_goods(self):
		self.set("po_items", [])
		self.set("prod_plan_references", [])

		so_list = [d.sales_order for d in self.get("sales_orders") if d.sales_order]
		if not so_list:
			frappe.throw(_("Please fill the Sales Orders table"), title=_("Sales Orders Required"))

		bom = frappe.qb.DocType("BOM")
		so_item = frappe.qb.DocType("Sales Order Item")
		item = frappe.qb.DocType("Item")

		bom_subquery = (
			frappe.qb.from_(bom)
			.from_(item)
			.select(bom.name)
			.where(
				(item.name == so_item.item_code)
				& bom.item.isin([item.name, item.variant_of])
				& (bom.is_active == 1)
			)
		)

		items = (
			frappe.qb.from_(so_item)
			.select(
				so_item.parent,
				so_item.item_code,
				so_item.warehouse,
				so_item.qty,
				so_item.work_order_qty,
				so_item.delivered_qty,
				so_item.conversion_factor,
				so_item.description,
				so_item.name,
				so_item.bom_no,
			)
			.distinct()
			.where(
				(so_item.parent.isin(so_list))
				& (so_item.docstatus == 1)
				& (so_item.qty > so_item.work_order_qty)
				& (so_item.item_code == self.item_to_transfer)
				& ExistsCriterion(bom_subquery)
			)
		).run(as_dict=True)

		for d in items:
			d.pending_qty = (flt(d.qty) - max(d.work_order_qty, d.delivered_qty, 0)) * d.conversion_factor

		self.add_items(items)
		self.calculate_total_planned_qty()

	@frappe.whitelist()
	def combine_so_items(self):
		"""Consolidate Sales Order Items checkbox"""
		if self.consolidate_sales_order_items and self.po_items:
			items = [
				frappe._dict(
					parent=row.sales_order,
					item_code=row.item_code,
					warehouse=row.warehouse,
					qty=row.pending_qty,
					pending_qty=row.pending_qty,
					conversion_factor=1.0,
					description=row.description,
					bom_no=row.bom_no,
					name=row.sales_order_item,
				)
				for row in self.po_items
			]
			self.set("po_items", [])
			self.set("prod_plan_references", [])
			self.add_items(items)
		else:
			self.get_finished_goods()

	def add_items(self, items):
		refs = {}
		for data in items:
			if not data.pending_qty:
				continue

			item_details = get_item_details(data.item_code, throw=False)
			bom_no = data.bom_no or (item_details and item_details.get("bom_no")) or ""
			if not bom_no:
				continue

			if self.consolidate_sales_order_items:
				so_detail = {"sales_order": data.parent, "sales_order_item": data.name, "qty": data.pending_qty}
				if bom_no in refs:
					refs[bom_no]["so_details"].append(so_detail)
					refs[bom_no]["qty"] += data.pending_qty
					continue
				refs[bom_no] = {"qty": data.pending_qty, "po_item_ref": data.name, "so_details": [so_detail]}

			pi = self.append(
				"po_items",
				{
					"warehouse": data.warehouse,
					"item_code": data.item_code,
					"description": data.description or (item_details and item_details.description),
					"stock_uom": (item_details and item_details.stock_uom) or "",
					"bom_no": bom_no,
					"planned_qty": data.pending_qty,
					"pending_qty": data.pending_qty,
					"planned_start_date": now_datetime(),
				},
			)
			pi._set_defaults()
			pi.sales_order = data.parent
			pi.sales_order_item = data.name
			self.set_job_details(pi, [data.name])

		if refs:
			for po_item in self.po_items:
				po_item.planned_qty = refs[po_item.bom_no]["qty"]
				po_item.pending_qty = refs[po_item.bom_no]["qty"]
				po_item.sales_order = ""
				self.set_job_details(
					po_item, [d["sales_order_item"] for d in refs[po_item.bom_no]["so_details"]]
				)
			if not self.meta.get_field("prod_plan_references"):
				frappe.msgprint(
					_("Field 'prod_plan_references' is missing in Finish Stock doctype, so Sales Order references were not saved."),
					alert=True,
				)
				return
			for bom_no, ref in refs.items():
				for so_detail in ref["so_details"]:
					self.append(
						"prod_plan_references",
						{
							"item_reference": ref["po_item_ref"],
							"sales_order": so_detail["sales_order"],
							"sales_order_item": so_detail["sales_order_item"],
							"qty": so_detail["qty"],
						},
					)

	def set_job_details(self, row, so_item_names):
		"""Set custom_job_number and custom_pos_no on the row from Sales Order Item."""
		job_numbers, pos_nos = [], []
		for name in so_item_names:
			if not name:
				continue
			values = frappe.db.get_value(
				"Sales Order Item", name, ["custom_job_number", "custom_pos_no"], as_dict=True
			)
			if not values:
				continue
			if values.custom_job_number and values.custom_job_number not in job_numbers:
				job_numbers.append(values.custom_job_number)
			if values.custom_pos_no and values.custom_pos_no not in pos_nos:
				pos_nos.append(values.custom_pos_no)

		row.custom_job_number = ", ".join(job_numbers)
		row.custom_pos_no = ", ".join(pos_nos)

	def calculate_total_planned_qty(self):
		self.total_planned_qty = sum(flt(d.planned_qty) for d in self.po_items)

	def on_submit(self):
		self.make_material_transfer()

	def on_cancel(self):
		self.cancel_material_transfer()

	def make_material_transfer(self):
		"""Create and submit a Material Transfer Stock Entry for all po_items rows."""
		for warehouse in (SOURCE_WAREHOUSE, TARGET_WAREHOUSE):
			if not frappe.db.exists("Warehouse", warehouse):
				frappe.throw(_("Warehouse {0} does not exist").format(frappe.bold(warehouse)))

		rows = [d for d in self.po_items if flt(d.planned_qty) > 0]
		if not rows:
			frappe.throw(_("No items with quantity found in PO Items to transfer"))

		company = frappe.db.get_value("Warehouse", SOURCE_WAREHOUSE, "company")

		se = frappe.new_doc("Stock Entry")
		se.stock_entry_type = "Material Transfer"
		se.purpose = "Material Transfer"
		se.company = company
		se.from_warehouse = SOURCE_WAREHOUSE
		se.to_warehouse = TARGET_WAREHOUSE
		se.custom_finish_stock = self.name
		se.remarks = _("Auto-created from Finish Stock {0}").format(self.name)

		for row in rows:
			se.append(
				"items",
				{
					"item_code": row.item_code,
					"qty": flt(row.planned_qty),
					"uom": row.stock_uom,
					"stock_uom": row.stock_uom,
					"conversion_factor": 1,
					"s_warehouse": SOURCE_WAREHOUSE,
					"t_warehouse": TARGET_WAREHOUSE,
					"sales_order": row.sales_order or None,
				},
			)

		se.set_missing_values()
		se.insert()
		se.submit()

		self.make_quality_inspections(se)

		if self.meta.get_field("stock_entry"):
			self.db_set("stock_entry", se.name)

		frappe.msgprint(
			_("Stock Entry {0} created").format(frappe.utils.get_link_to_form("Stock Entry", se.name)),
			alert=True,
		)

	def make_quality_inspections(self, se):
		qi_names = []
		customers = ", ".join(
			dict.fromkeys(d.customer for d in self.get("sales_orders") if d.customer)
		)
		for se_row, fs_row in zip(se.items, [d for d in self.po_items if flt(d.planned_qty) > 0]):
			qi = frappe.new_doc("Quality Inspection")
			qi.company = se.company
			qi.report_date = se.posting_date
			qi.inspection_type = "In Process"
			qi.status = "Accepted"
			qi.reference_type = "Stock Entry"
			qi.reference_name = se.name
			qi.child_row_reference = se_row.name
			qi.custom_finish_stock = self.name
			qi.item_code = se_row.item_code
			qi.sample_size = 1
			qi.inspected_by = frappe.session.user
			qi.remarks = _("Auto-created from Finish Stock {0}").format(self.name)

			optional_values = {
				"custom_transfer_warehouse": TARGET_WAREHOUSE,
				"custom_qty_transfer_to_quality": flt(se_row.qty),
				"custom_received_qty": flt(se_row.qty),
				"custom_accepted_qty": flt(se_row.qty),
				"custom_job_no": fs_row.get("custom_job_number"),
				"custom_customer_name": customers,
				"custom_drawing_no": self.get("drawing_no"),
			}
			for fieldname, value in optional_values.items():
				if value and qi.meta.get_field(fieldname):
					qi.set(fieldname, value)

			qi.insert()
			qi_names.append(qi.name)

		if qi_names:
			frappe.msgprint(
				_("Quality Inspection {0} created").format(
					", ".join(frappe.utils.get_link_to_form("Quality Inspection", n) for n in qi_names)
				),
				alert=True,
			)

	def cancel_material_transfer(self):
		for qi in frappe.get_all(
			"Quality Inspection",
			filters={"custom_finish_stock": self.name, "docstatus": ("<", 2)},
			fields=["name", "docstatus"],
		):
			if qi.docstatus == 1:
				frappe.get_doc("Quality Inspection", qi.name).cancel()
			else:
				frappe.delete_doc("Quality Inspection", qi.name)

		for se in frappe.get_all(
			"Stock Entry", filters={"custom_finish_stock": self.name, "docstatus": 1}, pluck="name"
		):
			frappe.get_doc("Stock Entry", se).cancel()

def on_quality_inspection_submit(doc, method=None):
	if not doc.get("custom_finish_stock"):
		return
	if flt(doc.get("custom_rejection_qty")) <= 0:
		return

	accepted = flt(doc.get("custom_accepted_qty"))

	old_se_name = frappe.db.get_value(
		"Stock Entry",
		{"custom_finish_stock": doc.custom_finish_stock, "docstatus": 1},
		"name",
		order_by="creation desc",
	)
	if not old_se_name:
		return
	old_se = frappe.get_doc("Stock Entry", old_se_name)

	target = next((r for r in old_se.items if r.name == doc.get("child_row_reference")), None) or next(
		(r for r in old_se.items if r.item_code == doc.item_code), None
	)
	if not target:
		return

	if accepted > flt(target.qty):
		frappe.throw(
			_("Accepted Qty {0} cannot be more than the transferred qty {1}").format(accepted, flt(target.qty))
		)
	if accepted == flt(target.qty):
		return

	new_rows = []
	for r in old_se.items:
		qty = accepted if r.name == target.name else flt(r.qty)
		if qty <= 0:
			continue
		new_rows.append(
			(
				r.name,
				{
					"item_code": r.item_code,
					"qty": qty,
					"uom": r.uom,
					"stock_uom": r.stock_uom,
					"conversion_factor": flt(r.conversion_factor) or 1,
					"s_warehouse": r.s_warehouse,
					"t_warehouse": r.t_warehouse,
					"sales_order": r.get("sales_order") or None,
				},
			)
		)

	old_se.flags.ignore_links = True
	old_se.cancel()

	if not new_rows:
		frappe.msgprint(
			_("Stock Entry {0} cancelled. Accepted Qty is 0, so no new Stock Entry was created.").format(
				old_se.name
			),
			alert=True,
		)
		return

	se = frappe.new_doc("Stock Entry")
	se.stock_entry_type = "Material Transfer"
	se.purpose = "Material Transfer"
	se.company = old_se.company
	se.from_warehouse = old_se.from_warehouse
	se.to_warehouse = old_se.to_warehouse
	se.custom_finish_stock = doc.custom_finish_stock
	se.remarks = _("Re-created from Finish Stock {0} after Quality Inspection {1}").format(
		doc.custom_finish_stock, doc.name
	)
	for _old_name, row in new_rows:
		se.append("items", row)
	se.set_missing_values()
	se.insert()
	se.submit()

	row_map = {old_name: new_row.name for (old_name, _row), new_row in zip(new_rows, se.items)}
	for qi in frappe.get_all(
		"Quality Inspection",
		filters={"reference_type": "Stock Entry", "reference_name": old_se.name, "docstatus": ("<", 2)},
		pluck="name",
	):
		old_ref = frappe.db.get_value("Quality Inspection", qi, "child_row_reference")
		values = {"reference_name": se.name}
		if old_ref in row_map:
			values["child_row_reference"] = row_map[old_ref]
		frappe.db.set_value("Quality Inspection", qi, values, update_modified=False)

	if frappe.get_meta("Finish Stock").has_field("stock_entry"):
		frappe.db.set_value("Finish Stock", doc.custom_finish_stock, "stock_entry", se.name, update_modified=False)

	frappe.msgprint(
		_("Stock Entry {0} cancelled and {1} created with accepted qty").format(
			old_se.name, frappe.utils.get_link_to_form("Stock Entry", se.name)
		),
		alert=True,
	)