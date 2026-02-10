frappe.ui.form.on('BOM', {
	refresh(frm) {
		// your code here
	}
})

frappe.ui.form.on("BOM Item", {
    item_code: function(frm, cdt, cdn) {
        let row = locals[cdt][cdn];

        if (row.item_code) {
            frappe.db.get_value("Item", row.item_code, "custom_material_pressure_one", function(r) {
                if (r && r.custom_material_pressure_one) {
                    frm.set_value("custom_material_pressure", r.custom_material_pressure_one);
                }
            });
        }
    }
});
