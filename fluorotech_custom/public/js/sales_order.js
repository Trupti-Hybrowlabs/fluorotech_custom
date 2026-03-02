frappe.ui.form.on('Sales Order Item', {
    item_code: function(frm, cdt, cdn) {
        let row = locals[cdt][cdn];
        if (row.item_code && !row.custom_job_number) {
            generate_job_number(frm, cdt, cdn);
        }
    }
});

function generate_job_number(frm, cdt, cdn) {
    let now = new Date();
    let year = now.getFullYear();
    let month = String(now.getMonth() + 1).padStart(2, '0');
    let prefix = `${year}-${month}-`;

    frappe.call({
        method: 'frappe.client.get_list',
        args: {
            doctype: 'Sales Order',
            fields: ['`tabSales Order Item`.custom_job_number'],
            filters: [['Sales Order Item', 'custom_job_number', 'like', prefix + '%']],
            order_by: '`tabSales Order Item`.custom_job_number desc',
            limit_page_length: 0
        },
        callback: function(r) {
            let last_seq = 0;

            if (r.message && r.message.length > 0) {
                let all_seq = r.message
                    .map(i => parseInt((i.custom_job_number || '').split('-').pop()))
                    .filter(n => !isNaN(n));
                if (all_seq.length > 0) last_seq = Math.max(...all_seq);
            }

            (frm.doc.items || []).forEach(row => {
                if (row.custom_job_number && row.custom_job_number.startsWith(prefix)) {
                    let n = parseInt(row.custom_job_number.split('-').pop());
                    if (!isNaN(n) && n > last_seq) last_seq = n;
                }
            });

            let new_seq = String(last_seq + 1).padStart(2, '0');
            frappe.model.set_value(cdt, cdn, 'custom_job_number', prefix + new_seq);
        }
    });
}