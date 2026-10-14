frappe.ui.form.on('Job Card', {
    onload: function(frm) {
        frm.set_df_property('operation', 'reqd', 0);
        frm.set_df_property('wip_warehouse', 'reqd', 0);
        frm.set_df_property('workstation', 'reqd', 0);
    },

    refresh: function (frm) {

        // --- PEEK ---
        render_peek_ui(frm);

        // --- PTFE ---
        render_ptfe_ui(frm);

        // --- CIC ---
        render_cic_ui(frm);
        cic_prefill_wo_pp(frm);
        
        frm.set_df_property('operation', 'reqd', 0);
        frm.toggle_reqd('operation', false);
        frm.refresh_field('operation');

        frm.set_df_property('wip_warehouse', 'reqd', 0);
        frm.toggle_reqd('wip_warehouse', false);
        frm.refresh_field('wip_warehouse');

        frm.set_df_property('workstation', 'reqd', 0);
        frm.toggle_reqd('workstation', false);
        frm.refresh_field('workstation');
    }
});


// ============================================================
// JOB CARD - PEEK
// ============================================================
const PEEK_HIDDEN_FIELD = 'custom_peek_data';
const PEEK_SIGN_FIELD = 'custom_peek_sign';

function peek_storage_key(frm) {
    return `peek_sheet_${frm.doc.name || 'new'}`;
}

function peek_load_data(frm) {
    if (frm.doc.hasOwnProperty(PEEK_HIDDEN_FIELD) && frm.doc[PEEK_HIDDEN_FIELD]) {
        try {
            return JSON.parse(frm.doc[PEEK_HIDDEN_FIELD]);
        } catch (e) {
            return {};
        }
    }
    try {
        const raw = window.localStorage.getItem(peek_storage_key(frm));
        return raw ? JSON.parse(raw) : {};
    } catch (e) {
        return {};
    }
}

let peek_save_timeout = null;
function peek_save_data(frm, dataObj) {
    const json = JSON.stringify(dataObj);
    if (frm.fields_dict.hasOwnProperty(PEEK_HIDDEN_FIELD)) {
        clearTimeout(peek_save_timeout);
        peek_save_timeout = setTimeout(() => {
            frm.set_value(PEEK_HIDDEN_FIELD, json);
        }, 400);
    } else {
        try {
            window.localStorage.setItem(peek_storage_key(frm), json);
        } catch (e) {
        }
    }
}

function peek_load_signature(frm) {
    if (frm.doc.hasOwnProperty(PEEK_SIGN_FIELD) && frm.doc[PEEK_SIGN_FIELD]) {
        return frm.doc[PEEK_SIGN_FIELD];
    }
    try {
        return window.localStorage.getItem(peek_storage_key(frm) + '_sign') || '';
    } catch (e) {
        return '';
    }
}

let peek_sign_save_timeout = null;
function peek_save_signature(frm, base64) {
    if (frm.fields_dict.hasOwnProperty(PEEK_SIGN_FIELD)) {
        clearTimeout(peek_sign_save_timeout);
        peek_sign_save_timeout = setTimeout(() => {
            frm.set_value(PEEK_SIGN_FIELD, base64);
        }, 400);
    } else {
        try {
            window.localStorage.setItem(peek_storage_key(frm) + '_sign', base64);
        } catch (e) {
        }
    }
}

function render_peek_ui(frm) {
    if (!frm.fields_dict.custom_peek) return;
    const wrapper = frm.fields_dict.custom_peek.$wrapper;
    const data = peek_load_data(frm);

    const css = `
        <style>
            .peek-sheet-table { width:100%; border-collapse:collapse; font-family:monospace; font-size:12px; margin-top:8px; }
            .peek-sheet-table th, .peek-sheet-table td {
                border:1px solid #888; padding:4px 6px; text-align:center; vertical-align:middle;
            }
            .peek-sheet-table .peek-section-header {
                background:#c9c9c9; font-weight:bold; font-size:13px; text-align:center;
            }
            .peek-sheet-table .peek-col-header {
                background:#e4e8e0; font-weight:bold; white-space:nowrap;
            }
            .peek-sheet-table .peek-label {
                text-align:left; font-weight:bold; background:#f7f7f7;
            }
            .peek-sheet-table .peek-spec { text-align:left; }
            .peek-sheet-table input[type=text],
            .peek-sheet-table input[type=date] {
                width:100%; box-sizing:border-box; border:none; background:transparent;
                font-family:monospace; font-size:12px; text-align:center; padding:2px;
            }
            .peek-sheet-table input[type=text]:focus,
            .peek-sheet-table input[type=date]:focus {
                outline:1px solid #5b9bd5; background:#fffbe6;
            }
            .peek-sheet-table .peek-left-input input { text-align:left; }
            .peek-sheet-table .peek-top-cell {
                vertical-align:top !important;
                padding:10px 12px !important;
            }
            .peek-signature-holder {
                min-height:70px;
                max-height:120px;
                overflow:hidden;
                background:#fff;
                border:1px dashed #999;
                margin-top:6px;
            }
            .peek-signature-holder canvas {
                width:100% !important;
                height:100% !important;
            }
        </style>
    `;

    const cell = (key, align) => `
        <td class="${align === 'left' ? 'peek-left-input' : ''}">
            <input type="text" data-key="${key}" value="${(data[key] || '').toString().replace(/"/g, '&quot;')}">
        </td>`;

    const cellInner = (key) => {
        const val = (data[key] || '').toString().replace(/"/g, '&quot;');
        return `<input type="text" data-key="${key}" value="${val}">`;
    };

    const timeCols = ['setup', 'verify', 'c2', 'c3', 'c4', 'c5'];

    function build_param_rows(rowKeyPrefix, params) {
        let out = '';
        params.forEach((row) => {
            if (row.merged) {
                const rowKeyBase = `${rowKeyPrefix}_${row.sr}`;
                out += `<tr>`;
                out += `<td>${row.sr}</td>`;
                out += `<td class="peek-label">${row.label}</td>`;
                if (row.fixed) {
                    out += `<td class="peek-spec">${row.specs.join('<br>')}</td>`;
                } else {
                    out += cell(`${rowKeyBase}_spec`, 'left');
                }
                timeCols.forEach(tc => { out += cell(`${rowKeyBase}_${tc}`); });
                out += cell(`${rowKeyBase}_remark`, 'left');
                out += `</tr>`;
                return;
            }
            row.specs.forEach((spec, sIdx) => {
                const rowKeyBase = `${rowKeyPrefix}_${row.sr}_${sIdx}`;
                out += `<tr>`;
                if (sIdx === 0) {
                    out += `<td rowspan="${row.specs.length}">${row.sr}</td>`;
                    out += `<td class="peek-label" rowspan="${row.specs.length}">${row.label}</td>`;
                }
                if (row.fixed) {
                    out += `<td class="peek-spec">${spec}</td>`;
                } else {
                    out += cell(`${rowKeyBase}_spec`, 'left');
                }
                timeCols.forEach(tc => { out += cell(`${rowKeyBase}_${tc}`); });
                out += cell(`${rowKeyBase}_remark`, 'left');
                out += `</tr>`;
            });
        });
        return out;
    }

    const moldingParams = [
        { sr: '1', label: 'DIE RING CONDITION', fixed: true, specs: ['Free from bend,Ovality,scoring,damage,powder sticking', 'Ejection Ring availability'] },
        { sr: '2', label: 'WEIGHT/MOLD', fixed: false, specs: [''] },
        { sr: '3', label: '1ST PRESSURE', fixed: false, specs: [''] },
        { sr: '4', label: 'HOLD TIME', fixed: false, specs: [''] },
        { sr: '5', label: '2ND PRESSURE', fixed: false, specs: [''] },
        { sr: '6', label: 'HOLD TIME', fixed: false, specs: [''] }
    ];
    const moldingRows = build_param_rows('mold', moldingParams);

    const hotCompressionParams = [
        { sr: '1', label: 'TEMP.', fixed: false, specs: [''] },
        { sr: '2', label: 'Heat Treatment', fixed: true, merged: true, specs: ['IN TIME', 'OUT TIME'] },
        { sr: '3', label: 'PRESSURE', fixed: false, specs: [''] },
        { sr: '4', label: 'HOLDING TIME', fixed: false, specs: [''] },
        { sr: '5', label: 'OD', fixed: false, specs: [''] },
        { sr: '6', label: 'ID', fixed: false, specs: [''] },
        { sr: '7', label: 'LENGTH', fixed: false, specs: [''] }
    ];
    const hotCompressionRows = build_param_rows('hotc', hotCompressionParams);

    const postCuringParams = [
        { sr: '1', label: 'TEMP.', fixed: false, specs: [''] },
        { sr: '2', label: 'IN TIME', fixed: false, specs: [''] },
        { sr: '3', label: 'OUT TIME', fixed: false, specs: [''] },
        { sr: '4', label: 'OD', fixed: false, specs: [''] },
        { sr: '5', label: 'ID', fixed: false, specs: [''] },
        {
            sr: '6', label: 'VISUAL CHECK POINT', fixed: true,
            specs: ['FREE FROM HEAVY FLASH', 'FREE FROM CRACK', 'FREE FROM WHITE SPOT/INCLUSION', 'FREE FROM OXIDATION']
        }
    ];
    const postCuringRows = build_param_rows('post', postCuringParams);

    const afterChecks = ['FREE FROM BEND/OVALITY', 'FREE FROM SCORING', 'FREE FROM DAMAGE', 'NO POWDER STICKING'];
    let afterRows = '';
    afterChecks.forEach((spec, idx) => {
        const key = `after_${idx}`;
        afterRows += `<tr>`;
        if (idx === 0) {
            afterRows += `<td rowspan="${afterChecks.length}">1</td>`;
            afterRows += `<td class="peek-label" rowspan="${afterChecks.length}">VISUAL CHECK POINT</td>`;
        }
        afterRows += `<td class="peek-spec" colspan="2">${spec}</td>`;
        afterRows += cell(`${key}_status`);
        afterRows += `<td colspan="5"></td>`;
        afterRows += `</tr>`;
    });

    const dateVal = (data['after_date'] || '').toString().replace(/"/g, '&quot;');
    const existingSign = peek_load_signature(frm);

    const html = `
        ${css}
        <table class="peek-sheet-table">
            <thead>
                <tr><th colspan="10" class="peek-section-header">PROCESS PARAMETER-MOLDING</th></tr>
                <tr>
                    <th class="peek-col-header">SR.<br>NO</th>
                    <th class="peek-col-header">PARAMETER</th>
                    <th class="peek-col-header">SPECIFICATION</th>
                    <th class="peek-col-header">Set up (1)</th>
                    <th class="peek-col-header">VERIFY<br>(QA/SUP)</th>
                    <th class="peek-col-header">2</th>
                    <th class="peek-col-header">3</th>
                    <th class="peek-col-header">4</th>
                    <th class="peek-col-header">5</th>
                    <th class="peek-col-header">Remark</th>
                </tr>
            </thead>
            <tbody>
                ${moldingRows}
                <tr><td colspan="10" class="peek-section-header">HOT COMPRESSION</td></tr>
                ${hotCompressionRows}
                <tr><td colspan="10" class="peek-section-header">POST CURING</td></tr>
                ${postCuringRows}
                <tr>
                    <td colspan="2" class="peek-label">Remark/Judgement</td>
                    <td colspan="8">${cellInner('remark_judgement')}</td>
                </tr>
                <tr>
                    <td colspan="10" class="peek-label" style="text-align:left;">
                        Resp-For Set up supervisor &amp; For inprocess operator(Sign) &nbsp;&nbsp;
                        ${cellInner('resp_signature')}
                    </td>
                </tr>
            </tbody>
        </table>

        <table class="peek-sheet-table" style="margin-top:14px;">
            <thead>
                <tr>
                    <th colspan="10" class="peek-section-header">
                        DIE RING CONDITION AFTER PRODUCTION COMPLETION
                    </th>
                </tr>
            </thead>
            <tbody>
                <tr>
                    <td colspan="5" class="peek-label peek-top-cell" style="text-align:left;">
                        DATE:
                        <input type="date" data-key="after_date" value="${dateVal}">
                    </td>
                    <td colspan="5" class="peek-label peek-top-cell" style="text-align:left;">
                        SIGN OF SUPERVISOR
                        <div id="peek-sign-supervisor" class="peek-signature-holder"></div>
                    </td>
                </tr>
                ${afterRows}
                <tr>
                    <td colspan="3" class="peek-label" style="text-align:left;">REMARK:</td>
                    <td colspan="3">${cellInner('after_remark')}</td>
                    <td colspan="2" class="peek-label" style="text-align:left;">SEEN BY PRODUCTION MANAGER</td>
                    <td colspan="2">${cellInner('seen_pm')}</td>
                </tr>
                <tr>
                    <td colspan="3"></td>
                    <td colspan="3"></td>
                    <td colspan="2" class="peek-label" style="text-align:left;">SEEN BY GM</td>
                    <td colspan="2">${cellInner('seen_gm')}</td>
                </tr>
                <tr>
                    <td colspan="3"></td>
                    <td colspan="3"></td>
                    <td colspan="2" class="peek-label" style="text-align:left;">ENTRY IN SUMMARY REPORT MADE BY QA PERSON</td>
                    <td colspan="2">${cellInner('entry_qa')}</td>
                </tr>
            </tbody>
        </table>
    `;

    wrapper.html(html);

    wrapper.find('input[data-key]').on('input change', function () {
        const key = $(this).attr('data-key');
        const val = $(this).val();
        const current = peek_load_data(frm);
        current[key] = val;
        peek_save_data(frm, current);
    });

    const $sigHolder = wrapper.find('#peek-sign-supervisor');
    if ($sigHolder.length) {
        const sig_control = frappe.ui.form.make_control({
            parent: $sigHolder.get(0),
            df: {
                fieldtype: 'Signature',
                fieldname: 'peek_sign_supervisor',
                label: ''
            },
            render_input: true
        });
        sig_control.refresh();

        if (existingSign) {
            sig_control.set_value(existingSign);
        }

        $sigHolder.on('mouseup touchend click', () => {
            setTimeout(() => {
                peek_save_signature(frm, sig_control.get_value());
            }, 150);
        });
    }
}


// ============================================================
// JOB CARD - PTFE
// ============================================================
const PTFE_HIDDEN_FIELD = 'custom_ptfe_data'; 
const PTFE_SIGN_FIELD = 'custom_ptfe_sign';   

function ptfe_storage_key(frm) {
    return `ptfe_sheet_${frm.doc.name || 'new'}`;
}

function ptfe_load_signature(frm) {
    if (frm.doc.hasOwnProperty(PTFE_SIGN_FIELD) && frm.doc[PTFE_SIGN_FIELD]) {
        return frm.doc[PTFE_SIGN_FIELD];
    }
    try {
        return window.localStorage.getItem(ptfe_storage_key(frm) + '_sign') || '';
    } catch (e) {
        return '';
    }
}

let ptfe_sign_save_timeout = null;
function ptfe_save_signature(frm, base64) {
    if (frm.fields_dict.hasOwnProperty(PTFE_SIGN_FIELD)) {
        clearTimeout(ptfe_sign_save_timeout);
        ptfe_sign_save_timeout = setTimeout(() => {
            frm.set_value(PTFE_SIGN_FIELD, base64);
        }, 400);
    } else {
        try {
            window.localStorage.setItem(ptfe_storage_key(frm) + '_sign', base64);
        } catch (e) {
            // fail silently
        }
    }
}

function ptfe_load_data(frm) {
    if (frm.doc.hasOwnProperty(PTFE_HIDDEN_FIELD) && frm.doc[PTFE_HIDDEN_FIELD]) {
        try {
            return JSON.parse(frm.doc[PTFE_HIDDEN_FIELD]);
        } catch (e) {
            return {};
        }
    }
    try {
        const raw = window.localStorage.getItem(ptfe_storage_key(frm));
        return raw ? JSON.parse(raw) : {};
    } catch (e) {
        return {};
    }
}

let ptfe_save_timeout = null;
function ptfe_save_data(frm, dataObj) {
    const json = JSON.stringify(dataObj);
    if (frm.fields_dict.hasOwnProperty(PTFE_HIDDEN_FIELD)) {
        clearTimeout(ptfe_save_timeout);
        ptfe_save_timeout = setTimeout(() => {
            frm.set_value(PTFE_HIDDEN_FIELD, json);
        }, 400);
    } else {
        try {
            window.localStorage.setItem(ptfe_storage_key(frm), json);
        } catch (e) {
            // fail silently
        }
    }
}

function render_ptfe_ui(frm) {
    if (!frm.fields_dict.custom_ptfe) return;
    const wrapper = frm.fields_dict.custom_ptfe.$wrapper;
    const data = ptfe_load_data(frm);

    const css = `
        <style>
            .ptfe-sheet-table { width:100%; border-collapse:collapse; font-family:monospace; font-size:12px; margin-top:8px; }
            .ptfe-sheet-table th, .ptfe-sheet-table td {
                border:1px solid #888; padding:4px 6px; text-align:center; vertical-align:middle;
            }
            .ptfe-sheet-table .ptfe-section-header {
                background:#c9c9c9; font-weight:bold; font-size:13px; text-align:center;
            }
            .ptfe-sheet-table .ptfe-col-header {
                background:#e4e8e0; font-weight:bold; white-space:nowrap;
            }
            .ptfe-sheet-table .ptfe-label {
                text-align:left; font-weight:bold; background:#f7f7f7;
            }
            .ptfe-sheet-table .ptfe-spec { text-align:left; }
            .ptfe-sheet-table input[type=text],
            .ptfe-sheet-table input[type=date] {
                width:100%; box-sizing:border-box; border:none; background:transparent;
                font-family:monospace; font-size:12px; text-align:center; padding:2px;
            }
            .ptfe-sheet-table input[type=text]:focus,
            .ptfe-sheet-table input[type=date]:focus {
                outline:1px solid #5b9bd5; background:#fffbe6;
            }
            .ptfe-sheet-table .ptfe-left-input input { text-align:left; }
            .ptfe-sheet-table .ptfe-top-cell {
                vertical-align:top !important;
                padding:10px 12px !important;
            }
            .ptfe-signature-holder {
                min-height:70px;
                max-height:120px;
                overflow:hidden;
                background:#fff;
                border:1px dashed #999;
                margin-top:6px;
            }
            .ptfe-signature-holder canvas {
                width:100% !important;
                height:100% !important;
            }
        </style>
    `;

    const cell = (key, align) => `
        <td class="${align === 'left' ? 'ptfe-left-input' : ''}">
            <input type="text" data-key="${key}" value="${(data[key] || '').toString().replace(/"/g, '&quot;')}">
        </td>`;

    const cellInner = (key) => {
        const val = (data[key] || '').toString().replace(/"/g, '&quot;');
        return `<input type="text" data-key="${key}" value="${val}">`;
    };

    const timeCols = ['setup', 'verify', '2hrs', '4hrs', '6hrs', '8hrs'];

    let processRows = '';
    const processParams = [
        { sr: '1', label: 'DIE RING CONDITION', fixed: true, specs: ['Free fron bend,Ovality,scoring,damage,powder sticking', 'Ejection Ring availability'] },
        { sr: '2', label: 'WEIGHT/MOLD', fixed: false, specs: [''] },
        { sr: '3', label: '1ST PRESSURE', fixed: false, specs: [''] },
        { sr: '4', label: 'HOLD TIME', fixed: false, specs: [''] },
        { sr: '5', label: '2ND PRESSURE', fixed: false, specs: [''] },
        { sr: '6', label: 'HOLD TIME', fixed: false, specs: [''] }
    ];

    processParams.forEach((row) => {
        row.specs.forEach((spec, sIdx) => {
            const rowKeyBase = `pp_${row.sr}_${sIdx}`;
            processRows += `<tr>`;
            if (sIdx === 0) {
                processRows += `<td rowspan="${row.specs.length}">${row.sr}</td>`;
                processRows += `<td class="ptfe-label" rowspan="${row.specs.length}">${row.label}</td>`;
            }
            if (row.fixed) {
                processRows += `<td class="ptfe-spec">${spec}</td>`;
            } else {
                processRows += cell(`${rowKeyBase}_spec`, 'left');
            }
            timeCols.forEach(tc => { processRows += cell(`${rowKeyBase}_${tc}`); });
            processRows += cell(`${rowKeyBase}_remark`, 'left');
            processRows += `</tr>`;
        });
    });

    let productRows = '';
    const simpleProductParams = [
        { sr: '7', label: 'OD' },
        { sr: '8', label: 'ID' },
        { sr: '9', label: 'LENGTH' }
    ];
    simpleProductParams.forEach(row => {
        const rowKeyBase = `prod_${row.sr}`;
        productRows += `<tr>
            <td>${row.sr}</td>
            <td class="ptfe-label">${row.label}</td>
            ${cell(`${rowKeyBase}_spec`, 'left')}
            ${timeCols.map(tc => cell(`${rowKeyBase}_${tc}`)).join('')}
            ${cell(`${rowKeyBase}_remark`, 'left')}
        </tr>`;
    });

    const visualChecks = ['FREE FROM FLASH', 'FREE FROM CRACK', 'FREE FROM WHITE SPOT/INCLUSION'];
    visualChecks.forEach((spec, idx) => {
        const rowKeyBase = `prod_10_${idx}`;
        productRows += `<tr>`;
        if (idx === 0) {
            productRows += `<td rowspan="${visualChecks.length}">10</td>`;
            productRows += `<td class="ptfe-label" rowspan="${visualChecks.length}">VISUAL CHECK POINT</td>`;
        }
        productRows += `<td class="ptfe-spec">${spec}</td>`; // fixed instruction wording, not editable
        productRows += timeCols.map(tc => cell(`${rowKeyBase}_${tc}`)).join('');
        productRows += cell(`${rowKeyBase}_remark`, 'left');
        productRows += `</tr>`;
    });

    const afterChecks = ['FREE FROM BEND/OVALITY', 'FREE FROM SCORING', 'FREE FROM DAMAGE', 'NO POWDER STICKING'];
    let afterRows = '';
    afterChecks.forEach((spec, idx) => {
        const key = `after_${idx}`;
        afterRows += `<tr>`;
        if (idx === 0) {
            afterRows += `<td rowspan="${afterChecks.length}">1</td>`;
            afterRows += `<td class="ptfe-label" rowspan="${afterChecks.length}">VISUAL CHECK POINT</td>`;
        }
        afterRows += `<td class="ptfe-spec" colspan="2">${spec}</td>`;
        afterRows += cell(`${key}_status`);
        afterRows += `<td colspan="5"></td>`;
        afterRows += `</tr>`;
    });

    const dateVal = (data['after_date'] || '').toString().replace(/"/g, '&quot;');
    const existingSign = ptfe_load_signature(frm);

    const html = `
        ${css}
        <table class="ptfe-sheet-table">
            <thead>
                <tr><th colspan="10" class="ptfe-section-header">Process Parameter</th></tr>
                <tr>
                    <th class="ptfe-col-header">SR.<br>NO</th>
                    <th class="ptfe-col-header">PARAMETER</th>
                    <th class="ptfe-col-header">SPECIFICATION</th>
                    <th class="ptfe-col-header">Set up</th>
                    <th class="ptfe-col-header">VERIFY<br>(QA/SUP)</th>
                    <th class="ptfe-col-header">2 HRS</th>
                    <th class="ptfe-col-header">4HRS</th>
                    <th class="ptfe-col-header">6HRS</th>
                    <th class="ptfe-col-header">8HRS</th>
                    <th class="ptfe-col-header">Remark</th>
                </tr>
            </thead>
            <tbody>
                ${processRows}
                <tr><td colspan="10" class="ptfe-section-header">Product Parameter</td></tr>
                ${productRows}
                <tr>
                    <td colspan="2" class="ptfe-label">Remark/Judgement</td>
                    <td colspan="8">${cellInner('remark_judgement')}</td>
                </tr>
                <tr>
                    <td colspan="10" class="ptfe-label" style="text-align:left;">
                        Resp-For Set up supervisor &amp; For inprocess operator(Sign) &nbsp;&nbsp;
                        ${cellInner('resp_signature')}
                    </td>
                </tr>
            </tbody>
        </table>

        <table class="ptfe-sheet-table" style="margin-top:14px;">
            <thead>
                <tr>
                    <th colspan="10" class="ptfe-section-header">
                        DIE RING CONDITION AFTER PRODUCTION COMPLETION
                    </th>
                </tr>
            </thead>
            <tbody>
                <tr>
                    <td colspan="5" class="ptfe-label ptfe-top-cell" style="text-align:left;">
                        DATE:
                        <input type="date" data-key="after_date" value="${dateVal}">
                    </td>
                    <td colspan="5" class="ptfe-label ptfe-top-cell" style="text-align:left;">
                        SIGN OF SUPERVISOR
                        <div id="ptfe-sign-supervisor" class="ptfe-signature-holder"></div>
                    </td>
                </tr>
                ${afterRows}
                <tr>
                    <td colspan="3" class="ptfe-label" style="text-align:left;">REMARK:</td>
                    <td colspan="3">${cellInner('after_remark')}</td>
                    <td colspan="2" class="ptfe-label" style="text-align:left;">SEEN BY PRODUCTION MANAGER</td>
                    <td colspan="2">${cellInner('seen_pm')}</td>
                </tr>
                <tr>
                    <td colspan="3"></td>
                    <td colspan="3"></td>
                    <td colspan="2" class="ptfe-label" style="text-align:left;">SEEN BY GM</td>
                    <td colspan="2">${cellInner('seen_gm')}</td>
                </tr>
                <tr>
                    <td colspan="3"></td>
                    <td colspan="3"></td>
                    <td colspan="2" class="ptfe-label" style="text-align:left;">ENTRY IN SUMMARY REPORT MADE BY QA PERSON</td>
                    <td colspan="2">${cellInner('entry_qa')}</td>
                </tr>
            </tbody>
        </table>
    `;

    wrapper.html(html);

    wrapper.find('input[data-key]').on('input change', function () {
        const key = $(this).attr('data-key');
        const val = $(this).val();
        const current = ptfe_load_data(frm);
        current[key] = val;
        ptfe_save_data(frm, current);
    });

    const $sigHolder = wrapper.find('#ptfe-sign-supervisor');
    if ($sigHolder.length) {
        const sig_control = frappe.ui.form.make_control({
            parent: $sigHolder.get(0),
            df: {
                fieldtype: 'Signature',
                fieldname: 'sign_supervisor',
                label: ''
            },
            render_input: true
        });
        sig_control.refresh();

        if (existingSign) {
            sig_control.set_value(existingSign);
        }

        $sigHolder.on('mouseup touchend click', () => {
            setTimeout(() => {
                ptfe_save_signature(frm, sig_control.get_value());
            }, 150);
        });
    }
}


// ============================================================
// JOB CARD - CIC
// ============================================================

const CIC_HIDDEN_FIELD = 'custom_cic_data';
const CIC_ROWS_COUNT = 5; 

function cic_prefill_wo_pp(frm) {
    if (!frm.doc.work_order || frm.doc.docstatus !== 0) return;
    if (!frm.fields_dict.hasOwnProperty(CIC_HIDDEN_FIELD)) return;

    const data = cic_load_data(frm);
    if (data.wo_no && data.pp_no && data.customer) return; 

    frappe.db.get_value('Work Order', frm.doc.work_order, 'production_plan').then(r => {
        const pp = (r && r.message && r.message.production_plan) || '';
        const current = cic_load_data(frm);
        let changed = false;

        if (!current.wo_no) {
            current.wo_no = frm.doc.work_order;
            changed = true;
        }
        if (!current.pp_no && pp) {
            current.pp_no = pp;
            changed = true;
        }
        if (!current.customer && frm.doc.custom_customer) {
            current.customer = frm.doc.custom_customer;
            changed = true;
        }
        if (changed) {
            frm.set_value(CIC_HIDDEN_FIELD, JSON.stringify(current)).then(() => {
                render_cic_ui(frm);
            });
        }
    });
}

function cic_storage_key(frm) {
    return `cic_sheet_${frm.doc.name || 'new'}`;
}

function cic_load_data(frm) {
    if (frm.doc.hasOwnProperty(CIC_HIDDEN_FIELD) && frm.doc[CIC_HIDDEN_FIELD]) {
        try {
            return JSON.parse(frm.doc[CIC_HIDDEN_FIELD]);
        } catch (e) {
            return {};
        }
    }
    try {
        const raw = window.localStorage.getItem(cic_storage_key(frm));
        return raw ? JSON.parse(raw) : {};
    } catch (e) {
        return {};
    }
}

let cic_save_timeout = null;
function cic_save_data(frm, dataObj) {
    const json = JSON.stringify(dataObj);
    if (frm.fields_dict.hasOwnProperty(CIC_HIDDEN_FIELD)) {
        clearTimeout(cic_save_timeout);
        cic_save_timeout = setTimeout(() => {
            frm.set_value(CIC_HIDDEN_FIELD, json);
        }, 400);
    } else {
        try {
            window.localStorage.setItem(cic_storage_key(frm), json);
        } catch (e) {
            // fail silently
        }
    }
}

function render_cic_ui(frm) {
    if (!frm.fields_dict['custom_cic_']) return;
    const wrapper = frm.fields_dict['custom_cic_'].$wrapper;
    const data = cic_load_data(frm);

    const css = `
        <style>
            .cic-sheet-table { width:100%; border-collapse:collapse; font-family:monospace; font-size:11px; margin-top:8px; }
            .cic-sheet-table th, .cic-sheet-table td {
                border:1px solid #888; padding:3px 5px; text-align:center; vertical-align:middle;
            }
            .cic-sheet-table .cic-section-header {
                background:#c9c9c9; font-weight:bold; font-size:13px; text-align:center;
            }
            .cic-sheet-table .cic-col-header {
                background:#e4e8e0; font-weight:bold; white-space:normal; font-size:10px;
            }
            .cic-sheet-table .cic-label {
                text-align:left; font-weight:bold; background:#f7f7f7; white-space:nowrap;
            }
            .cic-sheet-table .cic-fixed-text { text-align:left; font-size:10px; }
            .cic-sheet-table input[type=text],
            .cic-sheet-table input[type=date] {
                width:100%; box-sizing:border-box; border:none; background:transparent;
                font-family:monospace; font-size:11px; text-align:center; padding:2px;
            }
            .cic-sheet-table input[type=text]:focus,
            .cic-sheet-table input[type=date]:focus {
                outline:1px solid #5b9bd5; background:#fffbe6;
            }
            .cic-sheet-table .cic-left-input input { text-align:left; }
            .cic-sheet-table .cic-inline-field { display:flex; gap:4px; align-items:center; }
            .cic-sheet-table .cic-inline-field input {
                flex:1; border:1px solid #ccc !important; padding:2px 4px;
            }
            .cic-instructions {
                font-size:11px; text-align:left; line-height:1.5; padding:6px 8px;
            }
            .cic-instructions .cic-instr-title { font-weight:bold; }
            .cic-instructions .cic-instr-bold { font-weight:bold; color:#c0392b; }
        </style>
    `;

    const field = (key, label, type) => `
        <div class="cic-inline-field">
            <span>${label}</span>
            <input type="${type || 'text'}" data-key="${key}" value="${(data[key] || '').toString().replace(/"/g, '&quot;')}">
        </div>`;

    const cell = (key, align) => `
        <td class="${align === 'left' ? 'cic-left-input' : ''}">
            <input type="text" data-key="${key}" value="${(data[key] || '').toString().replace(/"/g, '&quot;')}">
        </td>`;

    const cic_instructions_html = `
        <div class="cic-instr-title">सूचना:</div>
        <div>डायमेन्शन,स्पेसिफिकेशन,चेकिंग इंस्ट्रुमेंटस आणि जॉब चेक करण्याची वारंवारता हे क्वालिटी इंजिनिअर कडून रिपोर्ट वर लिहिले जाईल.</div>
        <div class="cic-instr-bold">सेट-अप मंजूरी 0१ इंजिनिअर द्वारी केली जाईल.</div>
        <div>जॉब चेक करण्याची वारंवारता ठरवण्याची पद्धत:-</div>
        <div>१) जर टोटल टॉलरन्स 0.05 मिमी किंवा त्यापेक्षा कमी  ड्रॉईंग प्रमाणे डायमेन्शन sc /cc डायमेन्शन असेल तर  डायमेन्शन १००% चेक करणे. ( जबाबदारी ऑपरेटर )</div>
        <div>२) जर टोटल टॉलरन्स 0.05 मिमी पेक्षा जास्त असेल तर दर दहाव्या जॉब चेक करणे, जबाबदारी ऑपरेटर .</div>
        <div>३) सेट अप अॅप्रूव्हल आणि इंप्रोसेस इन्स्पेक्शन ची (दर २ तासाची )नोंद रिपोर्ट मध्ये करावी.</div>
    `;

    const dataColsA = [
        'characteristics', 'specification', 'tolerance', 'checking_instruments',
        'inspection_frequency', 'setup_first_piece', 'verification_qa',
        'not_ok_corrected'
    ];
    const dataColsB = [
        'after_2hr', 'after_4hr', 'after_6hr', 'after_8hr',
        'final_inspection', 'pdi'
    ];

    let partIRowsA = '';
    let partIRowsB = '';
    for (let i = 1; i <= CIC_ROWS_COUNT; i++) {
        partIRowsA += `<tr><td>${i}</td>`;
        dataColsA.forEach(col => {
            partIRowsA += cell(`row${i}_${col}`, 'left');
        });
        partIRowsA += `</tr>`;

        partIRowsB += `<tr><td>${i}</td>`;
        dataColsB.forEach(col => {
            partIRowsB += cell(`row${i}_${col}`, 'left');
        });
        partIRowsB += `</tr>`;
    }

    const partIIParams = [
        { sr: '1', param: 'Visual Inspection', spec: 'Free From Burr<br>Free From Damage<br>Free From Tool Mark<br>Free From Black spot and Inclusion', sample: '100%', resp: 'Visual inspector' },
        { sr: '2', param: 'Completion of all operations', spec: 'All operations as per customer drawing', sample: '10%', resp: 'Store person' },
        { sr: '3', param: 'Entry in ERP', spec: 'Under Inspection', sample: 'Every Batch', resp: 'Store person' },
        { sr: '4', param: 'Identification Tag', spec: 'Accepted Qty Tag ,Rejected Qty Tag ,Hold Qty Tag', sample: 'Every Batch', resp: 'Visual Inspector' },
        { sr: '5', param: 'PDIR/MTC', spec: 'As per customer  drawing', sample: '5 Nos', resp: 'PDI Inspector' },
        { sr: '6', param: 'Entry in ERP', spec: 'Finish Goods', sample: 'Every Batch', resp: 'PDI Inspector' }
    ];

    let partIIRows = '';
    partIIParams.forEach(row => {
        partIIRows += `<tr>
            <td>${row.sr}</td>
            <td class="cic-fixed-text">${row.param}</td>
            <td class="cic-fixed-text">${row.spec}</td>
            <td>${row.sample}</td>
            <td>${row.resp}</td>
            ${cell(`p2_row${row.sr}_observation`, 'left')}
            ${cell(`p2_row${row.sr}_inspected_final`, 'left')}
            ${cell(`p2_row${row.sr}_inspected_pdi`, 'left')}
            ${cell(`p2_row${row.sr}_accepted_qty`, 'left')}
            ${cell(`p2_row${row.sr}_rejected_qty`, 'left')}
        </tr>`;
    });

    const html = `
        ${css}
        <table class="cic-sheet-table">
            <tbody>
                <tr>
                    <td class="cic-left-input">${field('pp_no', 'PP No. :-')}</td>
                    <td class="cic-left-input">${field('wo_no', 'W/O No. :-')}</td>
                    <td class="cic-left-input">${field('customer', 'Customer :-')}</td>
                    <td class="cic-left-input">${field('part_rev_no', 'Part No. &amp; Rev. No. :-')}</td>
                </tr>
                <tr><td colspan="4" class="cic-section-header">MACHINING</td></tr>
                <tr>
                    <td class="cic-left-input">${field('machine_no', 'Machine No. :-')}</td>
                    <td class="cic-left-input">${field('operation_no', 'Operation No. :-')}</td>
                    <td class="cic-left-input">${field('operator_name', 'Operator Name :-')}</td>
                    <td rowspan="3" class="cic-instructions">
                        ${cic_instructions_html}
                    </td>
                </tr>
                <tr>
                    <td class="cic-left-input">${field('feed', 'Feed :-')}</td>
                    <td class="cic-left-input">${field('speed', 'Speed :-')}</td>
                    <td class="cic-left-input">${field('insert_spec', 'Insert Spec. :-')}</td>
                </tr>
                <tr>
                    <td class="cic-left-input">${field('shift', 'shift :-')}</td>
                    <td class="cic-left-input">${field('date', 'Date:-', 'date')}</td>
                    <td class="cic-left-input">${field('qa_inspection_time', 'QA Inspection End Time and Production start Time :-')}</td>
                </tr>
            </tbody>
        </table>

        <table class="cic-sheet-table" style="margin-top:10px;">
            <thead>
                <tr><th colspan="9" class="cic-section-header">Part I  Set up/ First piece/Inprocess inspection</th></tr>
                <tr>
                    <th class="cic-col-header">Sr.<br>No.</th>
                    <th class="cic-col-header">Characteristics</th>
                    <th class="cic-col-header">Specification</th>
                    <th class="cic-col-header">Tolerance</th>
                    <th class="cic-col-header">Checking<br>Instruments</th>
                    <th class="cic-col-header">Inspection<br>Frequency</th>
                    <th class="cic-col-header">Set up/ First Piece<br>Resp: Operator</th>
                    <th class="cic-col-header">Verification<br>Resp: QA Engineer</th>
                    <th class="cic-col-header">Not Ok Dimensions<br>Corrected Result/Verification<br>Resp: QA Engineer</th>
                </tr>
            </thead>
            <tbody>
                ${partIRowsA}
            </tbody>
        </table>

        <table class="cic-sheet-table" style="margin-top:10px;">
            <thead>
                <tr>
                    <th class="cic-col-header" rowspan="2">Sr.<br>No.</th>
                    <th class="cic-col-header" colspan="4">Recording Frequency</th>
                    <th class="cic-col-header" rowspan="2">Final inspection 5 Nos<br>Resp Except GD&amp;T<br>Final Inspector</th>
                    <th class="cic-col-header" rowspan="2">PDI 5 Nos<br>Resp Except GD&amp;T<br>PDI Inspector</th>
                </tr>
                <tr>
                    <th class="cic-col-header">After 2 Hours<br>(One Smaple)</th>
                    <th class="cic-col-header">After 4 Hours<br>(One Smaple)</th>
                    <th class="cic-col-header">After 6 Hours<br>(One Smaple)</th>
                    <th class="cic-col-header">After 8 Hours<br>(One Smaple)</th>
                </tr>
            </thead>
            <tbody>
                ${partIRowsB}
            </tbody>
        </table>

        <table class="cic-sheet-table" style="margin-top:10px;">
            <tbody>
                <tr>
                    <td class="cic-label" style="width:220px;">Inspected By Name and Initial :-</td>
                    <td colspan="3">${field('inspected_by', '')}</td>
                </tr>
                <tr>
                    <td class="cic-label">PACKING STANDARD</td>
                    <td class="cic-fixed-text">
                        *USE PLASTIC BIN FOR STORAGE OF PART AFTER MACHINING<br>
                        *USE CORROGATED SEPARATOR TO STORAGE PART LAYER WISE
                    </td>
                    <td class="cic-label" style="width:90px;">Operator</td>
                    <td>${field('packing_operator', '')}</td>
                </tr>
                <tr>
                    <td class="cic-label">Remark :-</td>
                    <td colspan="3">${field('remark', '')}</td>
                </tr>
                <tr>
                    <td class="cic-left-input" colspan="2">${field('prepared_by', 'Prepared By :- QMS Executive')}</td>
                    <td class="cic-left-input" colspan="2">${field('approved_by', 'Approved By :- Assistant Production Manager')}</td>
                </tr>
            </tbody>
        </table>

        <table class="cic-sheet-table" style="margin-top:10px;">
            <thead>
                <tr><th colspan="10" class="cic-section-header">Part II   Final and Pre-Dispatch Inspection</th></tr>
                <tr>
                    <th class="cic-col-header">Sr No</th>
                    <th class="cic-col-header">Parameter</th>
                    <th class="cic-col-header">SPECIFICATION</th>
                    <th class="cic-col-header">Sample Size</th>
                    <th class="cic-col-header">Responsibility</th>
                    <th class="cic-col-header">Observation</th>
                    <th class="cic-col-header">Inspected By Final<br>Inspector</th>
                    <th class="cic-col-header">Inspected By PDI<br>Inspector</th>
                    <th class="cic-col-header">Accepted Qty</th>
                    <th class="cic-col-header">Rejected Qty and<br>reason</th>
                </tr>
            </thead>
            <tbody>
                ${partIIRows}
            </tbody>
        </table>
    `;

    wrapper.html(html);

    wrapper.find('input[data-key], textarea[data-key]').on('input change', function () {
        const key = $(this).attr('data-key');
        const val = $(this).val();
        const current = cic_load_data(frm);
        current[key] = val;
        cic_save_data(frm, current);
    });
}