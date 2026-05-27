// Copyright (c) 2026, Trupti Ninghot and contributors
// For license information, please see license.txt

frappe.query_reports["Production Report"] = {
	filters: [
        {
            fieldname: "from_date",
            label: __("From Date"),
            fieldtype: "Date",
            default: frappe.datetime.add_months(frappe.datetime.get_today(), -1),
            reqd: 1
        },
        {
            fieldname: "to_date",
            label: __("To Date"),
            fieldtype: "Date",
            default: frappe.datetime.get_today(),
            reqd: 1
        },
        {
            fieldname: "work_order",
            label: __("Work Order"),
            fieldtype: "Link",
            options: "Work Order"
        },
        {
            fieldname: "item_code",
            label: __("Item Code"),
            fieldtype: "Link",
            options: "Item"
        },
        {
            fieldname: "stock_entry_type",
            label: __("Stock Entry Type"),
            fieldtype: "Select",
            options: "\nMaterial Transfer for Manufacture\nManufacture"
        }
    ]
};


