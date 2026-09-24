// Copyright (c) 2026, Trupti Ninghot and contributors
// For license information, please see license.txt

frappe.ui.form.on('Straightening', {
    refresh: function (frm) {
        render_straightening_ui(frm);
        straightening_prefill_from_wo(frm);
    },
    work_order: function (frm) {
        straightening_prefill_from_wo(frm, true);
    }
});

const STR_DATA_FIELD = 'straightening_data';

function str_load_data(frm) {
    try {
        return frm.doc[STR_DATA_FIELD] ? JSON.parse(frm.doc[STR_DATA_FIELD]) : {};
    } catch (e) {
        return {};
    }
}

let str_save_timeout = null;
function str_save_data(frm, dataObj) {
    clearTimeout(str_save_timeout);
    str_save_timeout = setTimeout(() => {
        frm.set_value(STR_DATA_FIELD, JSON.stringify(dataObj));
    }, 400);
}

function str_esc(v) {
    return (v || '').toString().replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');
}

// Work Order se auto-fill (sirf khaali fields mein)
function straightening_prefill_from_wo(frm, force) {
    if (!frm.doc.work_order) return;
    frappe.db.get_value('Work Order', frm.doc.work_order,
        ['production_item', 'item_name', 'qty']
    ).then(r => {
        let v = (r && r.message) || {};
        let data = str_load_data(frm);
        let changed = false;
        const setIf = (key, val) => {
            if (val && (force || !data[key])) {
                data[key] = val;
                changed = true;
            }
        };
        setIf('work_order_no', frm.doc.work_order);
        setIf('part_description', v.item_name);
        setIf('material', v.production_item);
        setIf('quantity', v.qty);
        if (changed) {
            frm.set_value(STR_DATA_FIELD, JSON.stringify(data)).then(() => {
                render_straightening_ui(frm);
            });
        }
    });
}

function render_straightening_ui(frm) {
    if (!frm.fields_dict.straightening) return;
    const wrapper = frm.fields_dict.straightening.$wrapper;
    const data = str_load_data(frm);

    const css = `
        <style>
            .str-table { width:100%; border-collapse:collapse; font-family:'Times New Roman',serif; font-size:12px; }
            .str-table th, .str-table td {
                border:1px solid #444; padding:4px 6px; text-align:center; vertical-align:middle;
            }
            .str-table .str-left { text-align:left; }
            .str-table .str-section {
                background:#eee; font-weight:bold; text-align:left;
            }
            .str-table .str-head { font-weight:normal; height:34px; }
            .str-table input[type=text], .str-table input[type=date] {
                width:100%; box-sizing:border-box; border:none; background:transparent;
                font-family:inherit; font-size:12px; padding:2px; text-align:center;
            }
            .str-table .str-left input { text-align:left; }
            .str-table input:focus { outline:1px solid #5b9bd5; background:#fffbe6; }
            .str-table .str-inline { display:flex; align-items:center; gap:4px; }
            .str-table .str-inline span { white-space:nowrap; font-weight:bold; }
            .str-table .str-obs { min-width:60px; }
        </style>
    `;

    const inp = (key) =>
        `<input type="text" data-key="${key}" value="${str_esc(data[key])}">`;
    const dateInp = (key) =>
        `<input type="date" data-key="${key}" value="${str_esc(data[key])}">`;
    const labeled = (label, key, type) =>
        `<td class="str-left"><div class="str-inline"><span>${label}</span>${type === 'date' ? dateInp(key) : inp(key)}</div></td>`;
    const cell = (key, left) =>
        `<td class="${left ? 'str-left' : ''}">${inp(key)}</td>`;
    const obsCells = (prefix) => {
        let o = '';
        for (let i = 1; i <= 6; i++) o += cell(`${prefix}_${i}`);
        return o;
    };

    const settingRows = [
        { sr: 1, label: 'Pipe condition', spec: 'No rust,bend', method: 'Visual' },
        { sr: 2, label: 'Temprature', spec: '310°C+/-5°C', method: 'Temp.controller' },
        { sr: 3, label: 'Time', spec: 'Min 2hrs', method: 'Timer' }
    ];
    let settingHtml = '';
    settingRows.forEach(r => {
        settingHtml += `<tr>
            <td>${r.sr}</td>
            <td class="str-left">${r.label}</td>
            <td>${r.spec}</td>
            <td class="str-left">${r.method}</td>
            ${obsCells(`set_${r.sr}`)}
            ${cell(`set_${r.sr}_remark`, true)}
        </tr>`;
    });

    const dimRows = [
        { sr: 1, label: 'OD', specEditable: true, method: 'Digital Vernier' },
        { sr: 2, label: 'ID', specEditable: true, method: 'Digital Vernier' },
        { sr: 3, label: 'Ovality on ID/ OD', prefix: 'Max', specEditable: true, method: 'Digital Vernier' },
        { sr: 4, label: 'Total length', specEditable: true, method: 'Digital Vernier' },
        {
            sr: 5, label: 'Visual Check points',
            spec: 'No Cracks, No Inclusions,<br>No porocity<br>No Ptches,<br>No Colour variation',
            method: 'Visual under illumination of 600 Lux min'
        },
        { sr: 6, label: 'Hardness', spec: '55+/-5 Shore D', method: 'Hardness Tester' }
    ];
    let dimHtml = '';
    dimRows.forEach(r => {
        let specCell;
        if (r.specEditable) {
            specCell = r.prefix
                ? `<td class="str-left"><div class="str-inline"><span>${r.prefix}</span>${inp(`dim_${r.sr}_spec`)}</div></td>`
                : cell(`dim_${r.sr}_spec`);
        } else {
            specCell = `<td>${r.spec}</td>`;
        }
        dimHtml += `<tr style="height:${r.sr === 5 ? 80 : 32}px;">
            <td>${r.sr}</td>
            <td class="str-left">${r.label}</td>
            ${specCell}
            <td class="str-left">${r.method}</td>
            ${obsCells(`dim_${r.sr}`)}
            ${cell(`dim_${r.sr}_remark`, true)}
        </tr>`;
    });

    const html = `
        ${css}
        <table class="str-table">
            <tbody>
                <tr>
                    ${labeled('Track sheet No:-', 'track_sheet_no')}
                    ${labeled('Customer Name:-', 'customer_name')}
                    <td class="str-left" colspan="2"><div class="str-inline"><span>Straigthening Mandrill Size:-</span>${inp('mandrill_size')}</div></td>
                </tr>
                <tr>
                    ${labeled('Work Order No:-', 'work_order_no')}
                    ${labeled('Part Description:-', 'part_description')}
                    <td class="str-left" colspan="2"><div class="str-inline"><span>Straigthening Date:-</span>${dateInp('straightening_date')}</div></td>
                </tr>
                <tr>
                    ${labeled('Material:-', 'material')}
                    ${labeled('Quantity:-', 'quantity')}
                    <td colspan="2"></td>
                </tr>
            </tbody>
        </table>

        <table class="str-table" style="margin-top:6px;">
            <thead>
                <tr class="str-head">
                    <th style="width:5%">Sr No.</th>
                    <th style="width:16%">Setting Requirements</th>
                    <th style="width:14%">Specification</th>
                    <th style="width:11%">Measuring Method</th>
                    <th class="str-obs">1</th><th class="str-obs">2</th><th class="str-obs">3</th>
                    <th class="str-obs">4</th><th class="str-obs">5</th><th class="str-obs">6</th>
                    <th style="width:10%">Remark</th>
                </tr>
            </thead>
            <tbody>
                ${settingHtml}
                <tr><td colspan="11" class="str-section">Dimension Inspection Report after straightening</td></tr>
                <tr class="str-head">
                    <th rowspan="2">Sr No.</th>
                    <th rowspan="2">Parameter</th>
                    <th rowspan="2">Specification</th>
                    <th rowspan="2">Measuring Method</th>
                    <th colspan="6">Observations<br>Identification No.</th>
                    <th rowspan="2">Remark</th>
                </tr>
                <tr class="str-head">
                    <th>1</th><th>2</th><th>3</th><th>4</th><th>5</th><th>6</th>
                </tr>
                ${dimHtml}
                <tr>
                    <td colspan="11" class="str-left" style="height:50px; vertical-align:top;">
                        <b>Remark</b>
                        ${inp('final_remark')}
                    </td>
                </tr>
                <tr>
                    <td colspan="6" class="str-left"><div class="str-inline"><span>Inspected By :</span>${inp('inspected_by')}</div></td>
                    <td colspan="5" class="str-left"><div class="str-inline"><span>Date :</span>${dateInp('inspected_date')}</div></td>
                </tr>
            </tbody>
        </table>
    `;

    wrapper.html(html);

    wrapper.find('input[data-key]').on('input change', function () {
        const key = $(this).attr('data-key');
        const current = str_load_data(frm);
        current[key] = $(this).val();
        str_save_data(frm, current);
    });
}