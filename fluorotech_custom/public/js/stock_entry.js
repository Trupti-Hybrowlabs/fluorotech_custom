// frappe.ui.form.on('Stock Entry', {
//     refresh: function(frm) {
//         handle_work_order_series(frm);
//     },
//     work_order: function(frm) {
//         handle_work_order_series(frm);
//     }
// });

// function handle_work_order_series(frm) {
//     if (!frm.doc.work_order) return;

//     frappe.db.get_value('Work Order', frm.doc.work_order, 'custom_series')
//         .then((r) => {
//             let series = r.message ? r.message.custom_series : null;
//             if (!series) return;

//             let from_warehouse, to_warehouse;
//             if (series.startsWith("CIC")) {
//                 from_warehouse = "Machining Store – FEPL";
//                 to_warehouse = "Under Quality Inspection - FEPL";
//             } else if (series.startsWith("SF")) {
//                 from_warehouse = "Molding Store – FEPL";
//                 to_warehouse = "Inward Machining Store  – FEPL";
//             }
//             if (from_warehouse && to_warehouse) {
//                 frm.set_value('from_warehouse', from_warehouse);
//                 frm.set_value('to_warehouse', to_warehouse);
//             }

//             let type = frm.doc.stock_entry_type;
//             let filters;

//             if (type === 'Material Transfer for Manufacture') {
//                 if (series === 'SF.####') {
//                     filters = { s: { custom_se_source_sf: 1 }, t: { custom_se_target_sf: 1 } };
//                 } else if (series === 'CIC.####') {
//                     filters = { s: { custom_se_source_cic: 1 }, t: { custom_se_target_cic: 1 } };
//                 }
//             } else if (type === 'Manufacture') {
//                 if (series === 'SF.####') {
//                     filters = { s: { custom_mfg_source_sf: 1 }, t: { custom_mfg_target_sf: 1 } };
//                 } else if (series === 'CIC.####') {
//                     filters = { s: { custom_mfg_source_cic: 1 }, t: { custom_mfg_target_cic: 1 } };
//                 }
//             }

//             if (filters) {
//                 frm.set_query('s_warehouse', 'items', () => ({ filters: filters.s }));
//                 frm.set_query('t_warehouse', 'items', () => ({ filters: filters.t }));
//             }
//         });
// }


frappe.ui.form.on('Stock Entry', {
    custom_quality_inspection_template: function(frm) {
        frm.clear_table('custom_parameters');

        if (frm.doc.custom_quality_inspection_template) {
            frappe.db.get_doc('Quality Inspection Template', frm.doc.custom_quality_inspection_template)
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