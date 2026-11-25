# Copyright (c) 2026, Trupti Ninghot and contributors
# For license information, please see license.txt

import frappe
from frappe import _
from frappe.model.document import Document
from frappe.utils import flt, now_datetime
from pypika.terms import ExistsCriterion

from erpnext.manufacturing.doctype.work_order.work_order import get_item_details


class FinishStock(Document):
	# ---------- Step 1: Get Sales Orders ----------
	@frappe.whitelist()
	def get_open_sales_orders(self):
		"""item_to_transfer ke liye jitne open Sales Orders hain wo table me bharta hai"""
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

		if refs:
			for po_item in self.po_items:
				po_item.planned_qty = refs[po_item.bom_no]["qty"]
				po_item.pending_qty = refs[po_item.bom_no]["qty"]
				po_item.sales_order = ""
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

	def calculate_total_planned_qty(self):
		self.total_planned_qty = sum(flt(d.planned_qty) for d in self.po_items)