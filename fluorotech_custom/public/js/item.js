frappe.ui.form.on('Item', {
    onload: function(frm) {
        load_raw_material_options(frm);
    },

    refresh: function(frm) {
        load_raw_material_options(frm);
    },

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

function load_raw_material_options(frm) {
    frappe.call({
        method: 'frappe.client.get_list',
        args: {
            doctype: 'Item',
            filters: [['item_group', '=', 'Raw Material']],
            fields: ['item_name'],
            order_by: 'item_name asc',
            limit_page_length: 0
        },
        callback: function(r) {
            if (r.message) {
                let options = [''];
                r.message.forEach(function(item) {
                    options.push(item.item_name);
                });
                options.sort((a, b) => a.localeCompare(b));
                frm.set_df_property(
                    'custom_combine_material_name',
                    'options',
                    options.join('\n')
                );
            }
        }
    });
}