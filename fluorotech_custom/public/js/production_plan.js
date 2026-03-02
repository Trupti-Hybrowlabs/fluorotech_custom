frappe.ui.form.on('Production Plan', {
    refresh: function(frm) {
        frm.page.wrapper.on('click', '[data-fieldname="get_items"]', function() {
            setTimeout(() => {
                set_job_numbers(frm);
            }, 2000);
        });
    }
});

function set_job_numbers(frm) {
    (frm.doc.po_items || []).forEach(row => {
        if (row.sales_order && row.item_code) {
            frappe.call({
                method: 'fluorotech_custom.config.py.sales_order.get_job_number_from_so',
                args: {
                    sales_order: row.sales_order,
                    item_code: row.item_code
                },
                callback: function(r) {
                    if (r.message) {
                        if (r.message.custom_job_number) {
                            frappe.model.set_value(row.doctype, row.name, 'custom_job_number', r.message.custom_job_number);
                        }
                        if (r.message.custom_pos_no) {
                            frappe.model.set_value(row.doctype, row.name, 'custom_pos_no', r.message.custom_pos_no);
                        }
                        frm.refresh_field('po_items');
                    }
                }
            });
        }
    });
}