frappe.ui.form.on('Sales Order Item', {
    item_code(frm, cdt, cdn) {
        let row = locals[cdt][cdn];
        if (row.item_code && !row.custom_job_number) {
            generate_job_number(frm, cdt, cdn);
        }
    }
});

function generate_job_number(frm, cdt, cdn) {
    const now = new Date();
    const prefix = `${String(now.getFullYear()).slice(-2)}${String(now.getMonth() + 1).padStart(2, '0')}`;

    frappe.call({
        method: 'frappe.client.get_list',
        args: {
            doctype: 'Sales Order',
            fields: ['`tabSales Order Item`.custom_job_number'],
            filters: [['Sales Order Item', 'custom_job_number', 'like', `${prefix}%`]],
            order_by: '`tabSales Order Item`.custom_job_number desc',
            limit_page_length: 1 
        },
        callback({ message }) {
            let last_seq = message?.length
                ? parseInt((message[0].custom_job_number || '').replace(prefix, '')) || 0
                : 0;

            (frm.doc.items || []).forEach(({ custom_job_number }) => {
                if (custom_job_number?.startsWith(prefix)) {
                    const n = parseInt(custom_job_number.replace(prefix, ''));
                    if (!isNaN(n) && n > last_seq) last_seq = n;
                }
            });

            frappe.model.set_value(cdt, cdn, 'custom_job_number', `${prefix}${String(last_seq + 1).padStart(2, '0')}`);
        }
    });
}