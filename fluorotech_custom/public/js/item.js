frappe.ui.form.on('Item', {
    has_batch_no: function(frm) {
        if (frm.doc.has_batch_no) {
            frm.set_value('create_new_batch', 1);
        } else {
            frm.set_value('create_new_batch', 0);
        }
    }
});

frappe.ui.form.on('Item Customer Detail', {
    customer_name: function(frm, cdt, cdn) {
        let row = locals[cdt][cdn];
        
        if (row.customer_name && frm.doc.custom_drawing_no) {
            frappe.model.set_value(cdt, cdn, 'ref_code', frm.doc.custom_drawing_no);
        }
    }
});