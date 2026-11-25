// Copyright (c) 2026, Trupti Ninghot and contributors
// For license information, please see license.txt

frappe.ui.form.on("Finish Stock", {
	setup(frm) {
		frm.set_query("sales_order", "sales_orders", () => {
			return {
				query: "erpnext.manufacturing.doctype.production_plan.production_plan.sales_order_query",
				filters: {
					company: frm.doc.company,
					item_code: frm.doc.item_to_transfer,
				},
			};
		});
	},

	get_sales_orders(frm) {
		if (!frm.doc.item_to_transfer) {
			frappe.msgprint(__("Please select Item To Transfer first"));
			return;
		}
		frappe.call({
			method: "get_open_sales_orders",
			doc: frm.doc,
			freeze: true,
			callback: function () {
				refresh_field("sales_orders");
			},
		});
	},

	get_finished_goods_for_manufacture(frm) {
		frm.clear_table("prod_plan_references");
		frappe.call({
			method: "get_finished_goods",
			doc: frm.doc,
			freeze: true,
			callback: function () {
				refresh_field("po_items");
			},
		});
	},

	consolidate_sales_order_items(frm) {
		frm.clear_table("prod_plan_references");
		frappe.call({
			method: "combine_so_items",
			doc: frm.doc,
			freeze: true,
			callback: function () {
				frm.refresh_field("po_items");
			},
		});
	},
});

frappe.ui.form.on("Production Plan Item", {
	item_code(frm, cdt, cdn) {
		if (frm.doctype !== "Finish Stock") return;
		const row = locals[cdt][cdn];
		if (row.item_code) {
			frappe.call({
				method: "erpnext.manufacturing.doctype.production_plan.production_plan.get_item_data",
				args: { item_code: row.item_code },
				callback: function (r) {
					for (let key in r.message) {
						frappe.model.set_value(cdt, cdn, key, r.message[key]);
					}
				},
			});
		}
	},
});

frappe.ui.form.on("Production Plan Sales Order", {
	sales_order(frm, cdt, cdn) {
		if (frm.doctype !== "Finish Stock") return;
		const sales_order = locals[cdt][cdn].sales_order;
		if (!sales_order) return;
		frappe.call({
			method: "erpnext.manufacturing.doctype.production_plan.production_plan.get_so_details",
			args: { sales_order },
			callback(r) {
				const { transaction_date, customer, grand_total } = r.message;
				frappe.model.set_value(cdt, cdn, "sales_order_date", transaction_date);
				frappe.model.set_value(cdt, cdn, "customer", customer);
				frappe.model.set_value(cdt, cdn, "grand_total", grand_total);
			},
		});
	},
});