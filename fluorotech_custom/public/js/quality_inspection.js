frappe.ui.form.on('Quality Inspection', {

    onload: function(frm) {
        set_reference_fields(frm);
    },

    reference_name: function(frm) {
        set_reference_fields(frm);
    },

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
    },

    batch_no: function(frm) {
        if (frm.doc.batch_no) {
            render_barcode(frm, frm.doc.batch_no);
        } else {
            frm.set_value('custom_batch_code', '');
            frm.get_field('custom_batch_code').$wrapper.find('.barcode-display-container').remove();
        }
    },

    refresh: function(frm) {
        if (frm.doc.docstatus === 2 && frm.doc.custom_work_order) {

            frm.add_custom_button(__('Rework'), function() {
                let d = new frappe.ui.Dialog({
                    title: __('Rework'),
                    fields: [{
                        fieldname: 'rework_qty',
                        fieldtype: 'Float',
                        label: __('Rework Qty'),
                        reqd: 1,
                        default: frm.doc.custom_rework_qty || 0
                    }],
                    primary_action_label: __('Submit'),
                    primary_action: function(values) {
                        if (flt(values.rework_qty) <= 0) {
                            frappe.msgprint(__('Rework Qty must be greater than 0'));
                            return;
                        }
                        frappe.confirm(
                            __('The Manufacture Stock Entry will be cancelled and recreated with {0} qty less. Continue?', [values.rework_qty]),
                            function() {
                                frappe.call({
                                    method: 'fluorotech_custom.config.py.work_order.rework_manufacture_entry',
                                    args: {
                                        quality_inspection: frm.doc.name,
                                        work_order: frm.doc.custom_work_order,
                                        rework_qty: values.rework_qty
                                    },
                                    freeze: true,
                                    callback: function(r) {
                                        if (r.message) {
                                            d.hide();
                                            frappe.show_alert({
                                                message: __('New Stock Entry {0} created and submitted', [r.message]),
                                                indicator: 'green'
                                            });
                                            frm.reload_doc();
                                        }
                                    }
                                });
                            }
                        );
                    }
                });
                d.show();
            }, __('Actions')).addClass('btn-danger');
        }

        if (frm.doc.batch_no) {
            render_barcode(frm, frm.doc.batch_no);
        }
    }
});

function set_reference_fields(frm) {
    if (frm.doc.reference_type === "Purchase Receipt" && frm.doc.reference_name) {

        frappe.db.get_doc("Purchase Receipt", frm.doc.reference_name).then((doc) => {

            const set_if_changed = (field, value) => {
                if (value === undefined || value === null || value === "") return;
                if (String(frm.doc[field] || "") !== String(value)) {
                    frm.set_value(field, value);
                }
            };

            set_if_changed("custom_supplier_name", doc.supplier_name);

            if (frm.doc.child_row_reference && doc.items) {
                let row = doc.items.find(i => i.name === frm.doc.child_row_reference);
                if (row) {
                    set_if_changed("custom_purchase_order", row.purchase_order);
                    set_if_changed("custom_quantity", row.custom_inwarded_qty);
                }
            }

            if (frm.is_new()) {
                frm.save();
            }
        }).catch((err) => {
            console.error("Error fetching Purchase Receipt:", err);
        });
    }
}

function render_barcode(frm, batch_value) {
    frm.set_value('custom_batch_code', batch_value);

    setTimeout(function() {
        var wrapper = frm.get_field('custom_batch_code').$wrapper;
        wrapper.find('.barcode-display-container').remove();

        var container = $(`
            <div class="barcode-display-container" style="margin-top:8px;padding:10px;background:#fff;border:1px solid #d1d8dd;border-radius:4px;text-align:center;width:100%;box-sizing:border-box;">
                <svg id="barcode-svg-${frm.doc.name || 'new'}" style="max-width:100%;height:auto;"></svg>
                <div style="font-size:12px;color:#333;margin-top:4px;font-family:monospace;letter-spacing:2px;">${batch_value}</div>
            </div>
        `);

        wrapper.append(container);

        if (window.JsBarcode) {
            JsBarcode(`#barcode-svg-${frm.doc.name || 'new'}`, batch_value, {
                format: "CODE128", width: 2, height: 60, displayValue: false, margin: 5
            });
        } else {
            var script = document.createElement('script');
            script.src = 'https://cdn.jsdelivr.net/npm/jsbarcode@3.11.6/dist/JsBarcode.all.min.js';
            script.onload = function() {
                JsBarcode(`#barcode-svg-${frm.doc.name || 'new'}`, batch_value, {
                    format: "CODE128", width: 2, height: 60, displayValue: false, margin: 5
                });
            };
            document.head.appendChild(script);
        }
    }, 300);
}