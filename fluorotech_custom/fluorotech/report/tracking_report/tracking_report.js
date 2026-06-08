// Copyright (c) 2026, Trupti Ninghot and contributors
// For license information, please see license.txt

frappe.query_reports["Tracking Report"] = {
	filters: [
        {
            fieldname: "from_date",
            label: __("From Date (PO Enter Date)"),
            fieldtype: "Date",
            default: frappe.datetime.add_months(frappe.datetime.get_today(), -1),
            reqd: 0
        },
        {
            fieldname: "to_date",
            label: __("To Date (PO Enter Date)"),
            fieldtype: "Date",
            default: frappe.datetime.get_today(),
            reqd: 0
        },
        {
            fieldname: "customer",
            label: __("Customer"),
            fieldtype: "Link",
            options: "Customer",
            reqd: 0
        },
        {
            fieldname: "item_code",
            label: __("Item Code"),
            fieldtype: "Link",
            options: "Item",
            reqd: 0
        },
        {
            fieldname: "dev_or_production",
            label: __("Development / Production"),
            fieldtype: "Select",
            options: "\nDevelopment\nProduction",
            reqd: 0
        },
        {
            fieldname: "job_no",
            label: __("Job No"),
            fieldtype: "Data",
            reqd: 0
        },
        {
            fieldname: "po_no",
            label: __("PO No"),
            fieldtype: "Data",
            reqd: 0
        },
        {
            fieldname: "delivery_date",
            label: __("Delivery Date"),
            fieldtype: "Date",
            reqd: 0
        }
    ]
 
};