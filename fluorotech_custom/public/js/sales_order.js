frappe.ui.form.on('Sales Order Item', {
    item_code: function(frm, cdt, cdn) {
        let row = locals[cdt][cdn];
        if (row.item_code && !row.custom_job_number) {
            generate_job_number(frm, cdt, cdn);
        }
    }
});


function generate_job_number(frm, cdt, cdn) {
    frappe.call({
        method: 'fluorotech_custom.config.py.sales_order.get_last_job_number',
        callback: function(r) {
            let last_number = r.message || 10000;

            (frm.doc.items || []).forEach(row => {
                let n = parseInt(row.custom_job_number);
                if (!isNaN(n) && n > last_number) last_number = n;
            });

            let new_job_number = String(last_number + 1);
            frappe.model.set_value(cdt, cdn, 'custom_job_number', new_job_number);
        }
    });
}