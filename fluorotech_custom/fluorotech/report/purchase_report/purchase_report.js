// Copyright (c) 2026, Trupti Ninghot and contributors
// For license information, please see license.txt

frappe.query_reports["Purchase Report"] = {
	filters: [
        {
            fieldname: "from_date",
            label: __("From Date (PO Date)"),
            fieldtype: "Date",
            default: frappe.datetime.add_months(frappe.datetime.get_today(), -1),
            reqd: 0
        },
        {
            fieldname: "to_date",
            label: __("To Date (PO Date)"),
            fieldtype: "Date",
            default: frappe.datetime.get_today(),
            reqd: 0
        },
        {
            fieldname: "supplier",
            label: __("Supplier"),
            fieldtype: "Link",
            options: "Supplier",
            reqd: 0
        },
        {
            fieldname: "po_no",
            label: __("PO No"),
            fieldtype: "Link",
            options: "Purchase Order",
            reqd: 0
        }
    ]
};
