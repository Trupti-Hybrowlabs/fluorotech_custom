frappe.ui.form.on("Work Order", {
    refresh(frm) {
        if (frm.doc.custom_range_of_size) {
            set_range_options(frm);
        }
        if (!frm.is_new() && !frm.doc.custom_density) {
            update_item_values(frm, true);
        }
    },
    
    custom_range_of_size(frm) {
        set_range_options(frm);
    },
    
    custom_mounlding_press_mc(frm) { 
        calculate_item_pressure(frm); 
    },
    
    custom_od(frm) { 
        calculate_item_pressure(frm);
        calculate_pressure_in_kg(frm);
        calculate_weight(frm);
    },
    
    custom_id(frm) { 
        calculate_item_pressure(frm);
        calculate_pressure_in_kg(frm);
        calculate_weight(frm);
    },
    
    custom_material_pressure(frm) { 
        calculate_item_pressure(frm); 
    },
    
    custom_press_mc_no(frm) { 
        calculate_pressure_in_kg(frm); 
    },
    
    custom_material_pressure_two(frm) { 
        calculate_pressure_in_kg(frm); 
    },
    
    custom_length_(frm) {
        calculate_item_pressure(frm);
        calculate_pressure_in_kg(frm);
        calculate_weight(frm);
    },
    
    custom_density(frm) { 
        calculate_weight(frm); 
    },
    
    custom_bush_quantity(frm) { 
        calculate_total_mold_weight(frm); 
    },
    
    custom_weight(frm) { 
        calculate_total_mold_weight(frm); 
    },
    
    custom_sub_work_order_type(frm) { 
        update_item_values(frm, false); 
    }
});

frappe.ui.form.on('Work Order Item', {
    item_code(frm) {
        update_item_values(frm, false);
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

function calculate_pressure_in_kg(frm) {
    calculate_pressure(frm, 'custom_pressure_in_kg', 'custom_material_pressure_two', 'custom_press_mc_no');
}

function calculate_weight(frm) {
    let {custom_od: od, custom_id: id, custom_length_: length, custom_density: density} = frm.doc;
    
    if (!od || !id || !length || !density) return;
    
    frappe.call({
        method: 'fluorotech_custom.config.py.work_order.weight',
        args: {od, id, length, density},
        callback: function(r) {
            if (r.message) {
                frm.set_value('custom_weight', r.message / 10);
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
    frm.set_value('qty', mold);
}