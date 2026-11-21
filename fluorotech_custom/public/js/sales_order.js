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
            limit_page_length: 0   
        },
        callback({ message }) {
            let last_seq = 0;

            const check = (num) => {
                if (num && String(num).startsWith(prefix)) {
                    const n = parseInt(String(num).slice(prefix.length), 10);
                    if (!isNaN(n) && n > last_seq) last_seq = n;   
                }
            };

            (message || []).forEach(r => check(r.custom_job_number));       
            (frm.doc.items || []).forEach(r => check(r.custom_job_number)); 

            frappe.model.set_value(
                cdt, cdn, 'custom_job_number',
                `${prefix}${String(last_seq + 1).padStart(2, '0')}`
            );
        }
    });
}