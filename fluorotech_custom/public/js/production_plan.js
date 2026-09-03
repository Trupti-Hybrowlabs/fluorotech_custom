frappe.ui.form.on('Production Plan', {
    refresh: function(frm) {
        frm.page.wrapper.on('click', '[data-fieldname="get_sales_orders"]', function() {
            setTimeout(() => {
                fetch_job_details(frm);
            }, 1500);
        });

        frm.page.wrapper.on('click', '[data-fieldname="get_items"]', function() {
            setTimeout(() => {
                fetch_job_details_for_po_items(frm);
            }, 1500);
        });
    }
});

function fetch_job_details(frm) {

    if (!frm.doc.item_code) {
        frappe.msgprint("Please select Item Code first.");
        return;
    }

    (frm.doc.sales_orders || []).forEach(row => {

        if (row.sales_order) {

            frappe.call({
                method: "fluorotech_custom.config.py.sales_order.get_job_number_from_so",
                args: {
                    sales_order: row.sales_order,
                    item_code: frm.doc.item_code   
                },
                callback: function(r) {
                    if (r.message) {

                        frappe.model.set_value(
                            row.doctype,
                            row.name,
                            "custom_job_number",
                            r.message.custom_job_number || ""
                        );

                        frappe.model.set_value(
                            row.doctype,
                            row.name,
                            "custom_pos_no",
                            r.message.custom_pos_no || ""
                        );
                    }
                }
            });

        }
    });

    frm.refresh_field("sales_orders");
}


function fetch_job_details_for_po_items(frm) {

    (frm.doc.po_items || []).forEach(row => {

        if (row.sales_order_item) {

            frappe.call({
                method: "fluorotech_custom.config.py.sales_order.get_job_number_from_so_item",
                args: {
                    sales_order_item: row.sales_order_item
                },
                callback: function(r) {
                    if (r.message) {

                        frappe.model.set_value(
                            row.doctype,
                            row.name,
                            "custom_job_number",
                            r.message.custom_job_number || ""
                        );

                        frappe.model.set_value(
                            row.doctype,
                            row.name,
                            "custom_pos_no",
                            r.message.custom_pos_no || ""
                        );
                    }
                }
            });

        }
    });

    frm.refresh_field("po_items");
}