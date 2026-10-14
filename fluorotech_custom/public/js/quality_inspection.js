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

                frappe.confirm(
                    __('This will cancel the Manufacture and Material Transfer Stock Entries for Work Order {0}. Are you sure?', [frm.doc.custom_work_order]),
                    function() {
                        frappe.call({
                            method: 'frappe.client.set_value',
                            args: {
                                doctype: 'Work Order',
                                name: frm.doc.custom_work_order,
                                fieldname: 'custom_machining_completed',
                                value: 0
                            },
                            callback: function() {
                                frappe.call({
                                    method: 'frappe.client.get_list',
                                    args: {
                                        doctype: 'Stock Entry',
                                        filters: {
                                            work_order: frm.doc.custom_work_order,
                                            docstatus: 1,
                                            purpose: ['in', ['Manufacture', 'Material Transfer for Manufacture']]
                                        },
                                        fields: ['name', 'purpose']
                                    },
                                    callback: function(r) {
                                        let entries = r.message || [];

                                        if (!entries.length) {
                                            frappe.msgprint(__('No submitted Stock Entries found for this Work Order.'));
                                            frm.reload_doc();
                                            return;
                                        }

                                        entries.sort((a, b) => (a.purpose === 'Manufacture' ? -1 : 1));

                                        let cancel_one = function(i) {
                                            if (i >= entries.length) {
                                                frappe.show_alert({
                                                    message: __('Stock Entries cancelled and Work Order updated.'),
                                                    indicator: 'green'
                                                });
                                                frm.reload_doc();
                                                return;
                                            }
                                            frappe.call({
                                                method: 'frappe.client.cancel',
                                                args: {
                                                    doctype: 'Stock Entry',
                                                    name: entries[i].name
                                                },
                                                callback: function() {
                                                    cancel_one(i + 1);
                                                },
                                                error: function() {
                                                    frappe.msgprint(__('Error cancelling {0}.', [entries[i].name]));
                                                }
                                            });
                                        };

                                        cancel_one(0);
                                    }
                                });
                            },
                            error: function() {
                                frappe.msgprint(__('Failed to update Work Order flag. Aborting.'));
                            }
                        });
                    }
                );

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

            if (doc.supplier_name) {
                frm.set_value("custom_supplier_name", doc.supplier_name);
            }

            if (frm.doc.child_row_reference && doc.items) {
                let row = doc.items.find(i => i.name === frm.doc.child_row_reference);
                if (row && row.purchase_order) {
                    frm.set_value("custom_purchase_order", row.purchase_order);
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