frappe.ui.form.on('Quality Inspection', {
    custom_quality_template: function(frm) {
        frm.clear_table('custom_parameters');

        if (frm.doc.custom_quality_template) {
            frappe.db.get_doc('Quality Inspection Template', frm.doc.custom_quality_template)
                .then((doc) => {
                    (doc.item_quality_inspection_parameter || []).forEach((row) => {
                        frm.add_child('custom_parameters').parameter = row.specification;
                    });
                    frm.refresh_field('custom_parameters');
                });
        } else {
            frm.refresh_field('custom_parameters');
        }
    }
});