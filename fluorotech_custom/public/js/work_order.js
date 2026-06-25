frappe.ui.form.on("Work Order", {
    refresh(frm) {
        if (frm.doc.custom_range_of_size) {
            set_range_options(frm);
        }
        if (!frm.is_new() && !frm.doc.custom_density) {
            update_item_values(frm, true);
        }
        if (frm.doc.docstatus === 0 && (frm.is_new() || frm.doc.__unsaved)) {
            setTimeout(() => {
                fetch_fifo_batches_for_all_items(frm);
            }, 300);
        }
        // frm.set_query('source_warehouse', () => ({ filters: { custom_batch_making: 1 } }));
        // frm.set_query('source_warehouse', 'required_items', () => ({ filters: { custom_batch_making: 1 } }));
        // frm.set_query('fg_warehouse', () => ({ filters: { custom_molding: 1 } }));
        frm.is_new() && set_processes(frm);
        set_warehouse_filters(frm);
    },
    onload: function(frm) { frm.is_new() && set_processes(frm); },
    
    custom_range_of_size(frm) {
        set_range_options(frm);
    },
    
    custom_mounlding_press_mc(frm) { 
        calculate_item_pressure(frm); 
        calculate_pressure_two(frm);
    },
    
    custom_od(frm) { 
        calculate_item_pressure(frm);
        calculate_pressure_in_kg(frm);
        calculate_weight(frm);
        calculate_pressure_two(frm); 
    },
    
    custom_id(frm) { 
        calculate_item_pressure(frm);
        calculate_pressure_in_kg(frm);
        calculate_weight(frm);
        calculate_pressure_two(frm); 
    },
    
    custom_material_pressure(frm) { 
        calculate_item_pressure(frm); 
    },
    
    custom_press_mc_no(frm) { 
        calculate_pressure_in_kg(frm); 
    },
    
    custom_material_pressure_two(frm) { 
        calculate_pressure_in_kg(frm); 
        calculate_pressure_two(frm); 
    },
    
    custom_length_(frm) {
        calculate_item_pressure(frm);
        calculate_pressure_in_kg(frm);
        calculate_weight(frm);
        calculate_pressure_two(frm); 
    },
    
    custom_density(frm) { 
        calculate_weight(frm); 
    },
    
    custom_bush_quantity(frm) { 
        calculate_total_mold_weight(frm);
        // if (!frm.doc.production_plan_sub_assembly_item || !frm.doc.custom_bush_quantity) return;
        
        // frappe.call({
        //     method: 'frappe.client.get_list',
        //     args: {
        //         doctype: 'Work Order',
        //         filters: {
        //             production_plan: frm.doc.production_plan,
        //             production_plan_item: ['!=', '']
        //         },
        //         fields: ['name']
        //     },
        //     callback: function(r) {
        //         if (!r.message || !r.message.length) return;
                
        //         r.message.forEach(wo => {
        //             frappe.db.get_doc('Work Order', wo.name).then(doc => {
        //                 if (doc.required_items.find(i => i.item_code === frm.doc.production_item)) {
        //                     frappe.call({
        //                         method: 'fluorotech_custom.config.py.work_order.update_work_order_qty',
        //                         args: {
        //                             work_order_name: wo.name,
        //                             qty_value: flt(frm.doc.custom_bush_quantity)
        //                         }
        //                     });
        //                 }
        //             });
        //         });
        //     }
        // });
    },
    
    custom_weight(frm) { 
        calculate_total_mold_weight(frm); 
    },
    
    custom_sub_work_order_type(frm) { 
        update_item_values(frm, false); 
        set_processes(frm);
        if (frm.doc.custom_sub_work_order_type === 'Forging process') {
            add_default_foreign_process_rows(frm);
        } else {
            frm.clear_table('custom_foreign_process');
            frm.refresh_field('custom_foreign_process');
        }
    },
    custom_moulding_completed(frm) {
        if (frm.doc.custom_moulding_completed) {
            frm.set_value('custom_moulding_completed_date', frappe.datetime.now_date());
        } else {
            frm.set_value('custom_moulding_completed_date', '');
        }
    },
    
    // custom__sintering_completed(frm) {
    //     if (frm.doc.custom__sintering_completed) {
    //         frm.set_value('custom_sintering_completed_date', frappe.datetime.now_date());
    //     } else {
    //         frm.set_value('custom_sintering_completed_date', '');
    //     }
    // },
    
    // custom_post_cooling_completed(frm) {
    //     if (frm.doc.custom_post_cooling_completed) {
    //         frm.set_value('custom_post_cooling_date', frappe.datetime.now_date());
    //     } else {
    //         frm.set_value('custom_post_cooling_date', '');
    //     }
    // },
    
    // custom_straightening_completed(frm) {
    //     if (frm.doc.custom_straightening_completed) {
    //         frm.set_value('custom_straightening_completed_date', frappe.datetime.now_date());
    //     } else {
    //         frm.set_value('custom_straightening_completed_date', '');
    //     }
    // },
    
    custom_return_to_moulding_stage(frm) {
        if (frm.doc.custom_return_to_moulding_stage) {
            frm.set_value('custom_return_to_moulding_stage_date', frappe.datetime.now_date());
        } else {
            frm.set_value('custom_return_to_moulding_stage_date', '');
        }
    },
    custom_lathe(frm) {
        if (frm.doc.custom_lathe) {
            frm.set_value('custom_lathe_date', frappe.datetime.now_date());
        } else {
            frm.set_value('custom_lathe_date', '');
        }
    },
    custom_cnc(frm) {
        if (frm.doc.custom_cnc) {
            frm.set_value('custom_cnc_date', frappe.datetime.now_date());
        } else {
            frm.set_value('custom_cnc_date', '');
        }
    },
    custom_vmc(frm) {
        if (frm.doc.custom_vmc) {
            frm.set_value('custom_vmc_date', frappe.datetime.now_date());
        } else {
            frm.set_value('custom_vmc_date', '');
        }
    },
    custom_deburing(frm) {
        if (frm.doc.custom_deburing) {
            frm.set_value('custom_deburing_date', frappe.datetime.now_date());
        } else {
            frm.set_value('custom_deburing_date', '');
        }
    },
    custom_machining_completed(frm) {
        if (frm.doc.custom_machining_completed) {
            frm.set_value('custom_machining_completed_date', frappe.datetime.now_date());
        } else {
            frm.set_value('custom_machining_completed_date', '');
        }
    },
    
    // before_save: function(frm) {
    //     fetch_fifo_batches_for_all_items(frm);
    // }
    custom_series: function(frm) {
        frm.clear_table('custom_process_tracking');
        set_processes(frm);
        set_warehouse_filters(frm);
    },
    custom_enable_process_tracking: function(frm) {
        (frm.doc.custom_process_tracking || []).forEach(row =>
            frappe.model.set_value(row.doctype, row.name, 'completed', frm.doc.custom_enable_process_tracking ? 1 : 0)
        );
        frm.refresh_field('custom_process_tracking');
    },
});


frappe.ui.form.on('Work Order Item', {
    item_code(frm, cdt, cdn) {
        update_item_values(frm, false);
    },

    source_warehouse(frm, cdt, cdn) {
        let row = locals[cdt][cdn];
        if (!row.item_code || !row.source_warehouse) return;

        frappe.model.set_value(cdt, cdn, 'custom_batch_no', '');

        setTimeout(() => {
            fetch_fifo_batches_for_single_row(frm, row, cdt, cdn);
        }, 300);
    }
});
function set_range_options(frm) {
    let range = frm.doc.custom_range_of_size;
    
    if (!range) {
        frm.set_df_property('custom_od', 'options', []);
        frm.set_df_property('custom_id', 'options', []);
        return;
    }
    
    ['od', 'id'].forEach(field => {
        frappe.call({
            method: `fluorotech_custom.config.py.work_order.get_${field}_values`,
            args: {range_of_size: range},
            callback: function(r) {
                if (r.message) {
                    frm.set_df_property(`custom_${field}`, 'options', [''].concat(r.message));
                    frm.refresh_field(`custom_${field}`);
                }
            }
        });
    });
}


function update_item_values(frm, is_refresh = false) {
    if (!frm.doc.required_items || !frm.doc.required_items.length) return;
    
    let first_item_code = frm.doc.required_items[0].item_code;
    if (!first_item_code) return;
    
    frappe.db.get_value(
        'Item',
        first_item_code,
        ['custom_combine_density', 'custom_material_pressure_one', 'custom_material_pressure_two'],
        function(r) {
            if (!r) return;
            
            let is_hot_compression = frm.doc.custom_sub_work_order_type === 'Hot Compression Process';
            
            if (is_refresh) {
                frm.doc.custom_density = r.custom_combine_density || 0;
                frm.doc.custom_material_pressure = is_hot_compression ? 0 : (r.custom_material_pressure_one || 0);
                frm.doc.custom_material_pressure_two = is_hot_compression ? (r.custom_material_pressure_two || 0) : 0;
                
                frm.refresh_field('custom_density');
                frm.refresh_field('custom_material_pressure');
                frm.refresh_field('custom_material_pressure_two');
            } else {
                frm.set_value('custom_density', r.custom_combine_density || 0);
                
                if (is_hot_compression) {
                    frm.set_value('custom_material_pressure_two', r.custom_material_pressure_two || 0);
                } else {
                    frm.set_value('custom_material_pressure', r.custom_material_pressure_one || 0);
                }
            }
        }
    );
}

function calculate_pressure(frm, field_name, material_field, machine_field) {
    let {custom_od: od, custom_id: id, custom_length_: length} = frm.doc;
    let material_pressure = frm.doc[material_field];
    let machine = frm.doc[machine_field];
    
    if (!od || !id || !material_pressure || !machine) return;
    
    frappe.call({
        method: 'fluorotech_custom.config.py.work_order.pressure',
        args: {
            od: od,
            id: id,
            length: length || 0,
            material_pressure: material_pressure,
            moulding_press_mc: machine
        },
        callback: function(r) {
            if (r.message !== undefined && r.message !== null) {
                frm.set_value(field_name, r.message);
            }
        }
    });
}

function calculate_item_pressure(frm) {
    calculate_pressure(frm, 'custom_item_pressure', 'custom_material_pressure', 'custom_mounlding_press_mc');
}

function calculate_pressure_two(frm) {
    calculate_pressure(frm, 'custom_pressure_two', 'custom_material_pressure_two', 'custom_mounlding_press_mc');
}

function calculate_pressure_in_kg(frm) {
    calculate_pressure(frm, 'custom_pressure_in_kg', 'custom_material_pressure_two', 'custom_press_mc_no');
}

// function calculate_weight(frm) {
//     let {custom_od: od, custom_id: id, custom_length_: length, custom_density: density} = frm.doc;
    
//     if (!od || !id || !length || !density) return;
    
//     frappe.call({
//         method: 'fluorotech_custom.config.py.work_order.weight',
//         args: {od, id, length, density},
//         callback: function(r) {
//             if (r.message) {
//                 frm.set_value('custom_weight', r.message / 10);
//             }
//         }
//     });
// }

function calculate_weight(frm) {
    let {custom_od: od, custom_id: id, custom_length_: length, custom_density: density} = frm.doc;
    
    if (!od || !id || !length || !density) return;
    
    frappe.call({
        method: 'fluorotech_custom.config.py.work_order.weight',
        args: {od, id, length, density},
        callback: function(r) {
            if (r.message) {
                let weight = parseFloat((r.message / 10).toFixed(3));
                frm.set_value('custom_weight', weight);
            }
        }
    });
}

function calculate_total_mold_weight(frm) {
    let bush_qty = parseFloat(frm.doc.custom_bush_quantity) || 0;
    let weight = parseFloat(frm.doc.custom_weight) || 0;
    
    if (!bush_qty || !weight) return;
    
    let mold = (bush_qty * weight).toFixed(3);
    
    frm.set_value('custom_total_mold_weight', mold);
    // frm.set_value('qty', mold);
    frm.doc.required_items.forEach(row => {
        frappe.model.set_value(row.doctype, row.name, 'custom_required_qty_1', mold);
        frappe.model.set_value(row.doctype, row.name, 'custom_batch_no', '');
    });
    
    setTimeout(() => {
        fetch_fifo_batches_for_all_items(frm);
    }, 300);
}

function fetch_fifo_batches_for_all_items(frm) {
    if (!frm.doc.required_items || frm.doc.required_items.length === 0) {
        return;
    }
    
    frm.doc.required_items.forEach((row, idx) => {
        if (row.item_code && (frm.doc.custom_total_mold_weight || row.required_qty)) {
            fetch_fifo_batches_for_single_row(frm, row, row.doctype, row.name);
        }
    });
}
function fetch_fifo_batches_for_single_row(frm, row, cdt = null, cdn = null) {
    let required_qty = frm.doc.custom_total_mold_weight || row.required_qty || 0;
    if (required_qty <= 0) return;

    if (!row.source_warehouse) {
        frappe.show_alert({ message: `Source warehouse missing for ${row.item_code}`, indicator: 'orange' });
        return;
    }

    frappe.call({
        method: 'erpnext.stock.doctype.batch.batch.get_batch_qty',
        args: {
            item_code: row.item_code,
            warehouse: row.source_warehouse,
            posting_date: frappe.datetime.get_today(),
            posting_time: frappe.datetime.now_time()
        },
        callback: function(r) {
            if (!r.message || r.message.length === 0) return;

            let batches = r.message
                .filter(b => b.qty > 0)
                .sort((a, b) => a.batch_no > b.batch_no ? 1 : -1);

            let remaining_qty = required_qty;
            let batch_data = [];

            for (let batch of batches) {
                if (remaining_qty <= 0) break;

                let qty_to_take = Math.min(batch.qty, remaining_qty);
                batch_data.push({
                    batch: batch.batch_no,
                    qty: parseFloat(qty_to_take.toFixed(3))
                });
                remaining_qty -= qty_to_take;
            }

            if (batch_data.length === 0) return;

            let batch_string = batch_data.map(b => `${b.batch}:${b.qty}`).join(',');
            let display_string = batch_data.map(b => b.batch).join(', ');

            if (cdt && cdn) {
                frappe.model.set_value(cdt, cdn, "custom_batch_no", batch_string);
                frappe.model.set_value(cdt, cdn, "custom_batch_display", display_string); 
            } else {
                row.custom_batch_no = batch_string;
            }

            frm.refresh_field("required_items");
        }
    });
}

function set_processes(frm) {
    if (frm.doc.custom_series !== 'SF.####') return;

    const is_strip = frm.doc.custom_sub_work_order_type === 'Strip Section Process';

    if (!is_strip) {
        (frm.doc.custom_process_tracking || [])
            .filter(r => ['Skiving', 'Etching'].includes(r.process_ct))
            .forEach(r => frm.get_field('custom_process_tracking').grid.grid_rows_by_docname[r.name]?.remove());
    }

    const processes = [
        'Molding',
        'Sintering',
        'Straightening',
        'Post Curing',
        ...(is_strip ? ['Skiving', 'Etching'] : [])
    ];

    const existing = (frm.doc.custom_process_tracking || []).map(r => r.process_ct);
    processes
        .filter(p => !existing.includes(p))
        .forEach(p => {
            let row = frm.add_child('custom_process_tracking');
            row.process_ct = p;
            row.completed = frm.doc.custom_enable_process_tracking ? 1 : 0;
        });

    frm.refresh_field('custom_process_tracking');
}


function set_warehouse_filters(frm) {
    let series = frm.doc.custom_series;
    
    if (series === 'SF.####') {
        frm.set_query('source_warehouse', () => ({ filters: { custom_source_sf: 1 } }));
        frm.set_query('source_warehouse', 'required_items', () => ({ filters: { custom_source_sf: 1 } }));
        frm.set_query('fg_warehouse', () => ({ filters: { custom_target_sf: 1 } }));
    } else if (series === 'CIC.####') {
        frm.set_query('source_warehouse', () => ({ filters: { custom_source_cic: 1 } }));
        frm.set_query('source_warehouse', 'required_items', () => ({ filters: { custom_source_cic: 1 } }));
        frm.set_query('fg_warehouse', () => ({ filters: { custom_target_cic: 1 } }));
    } else {
        frm.set_query('source_warehouse', () => ({ filters: {} }));
        frm.set_query('source_warehouse', 'required_items', () => ({ filters: {} }));
        frm.set_query('fg_warehouse', () => ({ filters: {} }));
    }
}

function add_default_foreign_process_rows(frm) {
    if (frm.doc.custom_foreign_process && frm.doc.custom_foreign_process.length > 0) {
        frm.clear_table('custom_foreign_process');
    }

    const default_operations = [
        "Forging/RM Receipt",
        "Semi finish machining 1st side",
        "Semi finish machining 2nd side",
        "CNC Machining 1st side",
        "CNC Machining 2nd side",
        "VMC Operation 1 - Sealent hole operation (Verticle Sealent hole) (If Applicable)",
        "VMC Operation 2 - Sealent hole operation (Horizontal Sealent hole) (If Applicable)",
        "CNC Machining 3rd side ID Finish",
        "NDT Testing (If Applicable)",
        "ENP Coating (OUTSOURCE) & Inward Insp at FTE (If Applicable)",
        "Insert Pressing 1",
        "Relaxation",
        "Insert Pressing 2",
        "Radius machining/Ball height",
        "Final Inspection",
        "Pre-Dispatch Inspection",
        "Packing & Dispatch",
    ];

    default_operations.forEach(function(op) {
        let row = frm.add_child('custom_foreign_process');
        row.operation_sequence = op;
    });

    frm.refresh_field('custom_foreign_process');
}