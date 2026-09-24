// Copyright (c) 2026, Trupti Ninghot and contributors
// For license information, please see license.txt

frappe.ui.form.on('Sintering', {
    refresh: function (frm) {
        render_sintering_ui(frm);
        sintering_prefill_from_wo(frm);
    },
    work_order: function (frm) {
        sintering_prefill_from_wo(frm, true);
    },
    cycle_no: function (frm) {
        render_sintering_ui(frm);
    }
});

const SIN_DATA_FIELD = 'sintering_data';
const SIN_ROWS_COUNT = 7;

const SIN_CYCLES = {
    'Cycle 1': {
        material: 'PTFE,TFM1600,CFT,15%Glass+5%Graphite+PTFE,HZ Combination',
        rev: 'Revision:-04(29.01.2026)',
        hours: ['5 Hrs', '10 Hrs', '12.5 Hrs', '14.5 Hrs', '15.5 Hrs'],
        rows: [
            { label: 'HEATING TIME', time: '5 Hrs', col: 0 },
            { label: 'SOCKING TIME', time: '5 Hrs', col: 1 },
            { label: 'COOLING TIME', time: '2.5 Hrs', col: 2 },
            { label: 'COOLING TIME', time: '2 Hrs', col: 3 },
            { label: 'COOLING TIME', time: '1 (Air Cooling)', col: 4 }
        ]
    },
    'Cycle 2': {
        material: 'PTFE (Arflu-Plug Valve)',
        rev: 'Revision:-03(02.12.2025)',
        hours: ['4 Hrs', '6 Hrs', '7 Hrs', '12 Hrs', '17 Hrs'],
        rows: [
            { label: 'HEATING TIME', time: '4 Hrs', col: 0 },
            { label: 'SOCKING TIME', time: '2 Hrs', col: 1 },
            { label: 'HOLDING TIME', time: '1 Hr', col: 2 },
            { label: 'HEATING TIME', time: '4 Hrs', col: 3 },
            { label: 'COOLING TIME', time: '5 Hrs', col: 4 }
        ]
    },
    'Cycle 3': {
        material: 'Habonim Rod Dia 200-300 mm',
        rev: 'Revision:-03(02.12.2025)',
        hours: ['5 Hrs', '10 Hrs', '12.5 Hrs', '13 Hrs', '15 Hrs'],
        rows: [
            { label: 'HEATING TIME', time: '5', col: 0 },
            { label: 'SOCKING TIME', time: '5', col: 1 },
            { label: 'HOLDING TIME', time: '2.5', col: 2 },
            { label: 'HEATING TIME', time: '0.5', col: 3 },
            { label: 'COOLING TIME', time: '2', col: 4 }
        ]
    },
    'Cycle 5': {
        material: 'GFT,FGR ,Ultra,Firesafe ,GLMOS2,Bronze filled PTFE',
        rev: 'Revision:-04(29.01.2026)',
        hours: ['5 Hrs', '10 Hrs', '12.5 Hrs', '14.5 Hrs', '15.5 Hrs'],
        rows: [
            { label: 'HEATING TIME', time: '5 Hrs', col: 0 },
            { label: 'SOCKING TIME', time: '5 Hrs', col: 1 },
            { label: 'COOLING TIME', time: '2.5 Hrs', col: 2 },
            { label: 'COOLING TIME', time: '2 Hrs', col: 3 },
            { label: 'COOLING TIME', time: '1 Hrs', col: 4 }
        ]
    },
    'Cycle 5-R': {
        material: '25% GFT',
        rev: 'Revision:-03(02.12.2025)',
        hours: ['2 Hrs', '2.5 Hrs', '2.75 Hrs', '4.25 Hrs', '4.5 Hrs', '6 Hrs', '6.25 Hrs', '10.25 Hrs', '15.25 Hrs'],
        rows: [
            { label: 'HEATING TIME', time: '2 Hrs', col: 0 },
            { label: 'HOLDING TIME', time: '30 Min', col: 1 },
            { label: 'HEATING TIME', time: '15 Min', col: 2 },
            { label: 'HOLDING TIME', time: '1.5 Hrs', col: 3 },
            { label: 'HEATING TIME', time: '15 Min', col: 4 },
            { label: 'HOLDING TIME', time: '1.5 Hrs', col: 5 },
            { label: 'HEATING TIME', time: '15 Min', col: 6 },
            { label: 'SOCKING TIME', time: '4 Hrs', col: 7 },
            { label: 'COOLING TIME', time: '5 Hrs', col: 8 }
        ]
    },
        'Cycle 5-A': {
        material: '25% GFT POLIS FF HDS',
        rev: 'Revision:-03(02.12.2025)',
        hours: ['3.5 Hrs', '5.5 Hrs', '7.5 Hrs', '9.5 Hrs', '11.5 Hrs', '15.5 Hrs', '17.5 Hrs', '19.5 Hrs', '25.5 Hrs'],
        rows: [
            { label: 'HEATING TIME', time: '3.5 Hrs', col: 0 },
            { label: 'HOLDING TIME', time: '2 Hrs', col: 1 },
            { label: 'HEATING TIME', time: '2 Hrs', col: 2 },
            { label: 'HOLDING TIME', time: '2 Hrs', col: 3 },
            { label: 'HEATING TIME', time: '2 Hrs', col: 4 },
            { label: 'SOCKING TIME', time: '4 Hrs', col: 5 },
            { label: 'COOLING TIME', time: '2 Hrs', col: 6 },
            { label: 'HOLDING TIME', time: '2 Hrs', col: 7 },
            { label: 'COOLING TIME', time: '6 Hrs', col: 8 }
        ]
    },
    'Cycle 6': {
        material: '',
        rev: 'Revision:-03(02.12.2025)',
        hours: ['5 Hrs', '12 Hrs', '13 Hrs', '15.5 Hrs', '16 Hrs', '22 Hrs', '24.5 Hrs', '26.5 Hrs', '28.5 Hrs', '30.5 Hrs', '36.5 Hrs'],
        rows: [
            { label: 'HEATING TIME', time: '5 Hrs', col: 0 },
            { label: 'SOCKING TIME', time: '2 Hrs', col: 1 },
            { label: 'HEATING TIME', time: '1 Hr', col: 2 },
            { label: 'HOLDING TIME', time: '2.5 Hrs', col: 3 },
            { label: 'HEATING TIME', time: '1 Hr', col: 4 },
            { label: 'SOCKING TIME', time: '6 Hrs', col: 5 },
            { label: 'HEATING TIME', time: '2.5 Hrs', col: 6 },
            { label: 'HOLDING TIME', time: '2 Hrs', col: 7 },
            { label: 'HEATING TIME', time: '2 Hrs', col: 8 },
            { label: 'HOLDING TIME', time: '2 Hrs', col: 9 }
        ]
    },
    'Cycle 11': {
        material: '',
        rev: 'Revision:-03(02.12.2025)',
        hours: ['1 Hrs', '1.5 Hrs', '2.10 Hrs', '3.10 Hrs', '4.10 Hrs', '5.40 Hrs', '7.40 Hrs', '8.40 Hrs'],
        rows: [
            { label: 'HEATING TIME', time: '1 Hrs', col: 0 },
            { label: 'SOCKING TIME', time: '30 min', col: 1 },
            { label: 'HOLDING TIME', time: '40 min', col: 2 },
            { label: 'HEATING TIME', time: '1 Hrs', col: 3 },
            { label: 'HOLDING TIME', time: '1 Hrs', col: 4 },
            { label: 'HEATING TIME', time: '90 min', col: 5 },
            { label: 'HEATING TIME', time: '121 min', col: 6 },
            { label: 'COOLING TIME', time: '120 min', col: 7 }
        ]
    }
};

function sin_get_cycle(frm) {
    return SIN_CYCLES[frm.doc.cycle_no] || SIN_CYCLES['Cycle 1'];
}

function sin_load_data(frm) {
    try {
        return frm.doc[SIN_DATA_FIELD] ? JSON.parse(frm.doc[SIN_DATA_FIELD]) : {};
    } catch (e) {
        return {};
    }
}

let sin_save_timeout = null;
function sin_save_data(frm, dataObj) {
    clearTimeout(sin_save_timeout);
    sin_save_timeout = setTimeout(() => {
        frm.set_value(SIN_DATA_FIELD, JSON.stringify(dataObj));
    }, 400);
}

function sin_esc(v) {
    return (v || '').toString().replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');
}

function sintering_prefill_from_wo(frm, force) {
    if (!frm.doc.work_order) return;
    frappe.db.get_value('Work Order', frm.doc.work_order,
        ['production_item', 'item_name', 'qty']
    ).then(r => {
        let v = (r && r.message) || {};
        let data = sin_load_data(frm);
        let changed = false;
        const setIf = (key, val) => {
            if (val && (force || !data[key])) {
                data[key] = val;
                changed = true;
            }
        };
        setIf('r1_wo', frm.doc.work_order);
        setIf('r1_item', v.item_name);
        if (changed) {
            frm.set_value(SIN_DATA_FIELD, JSON.stringify(data)).then(() => {
                render_sintering_ui(frm);
            });
        }
    });
}

function render_sintering_ui(frm) {
    if (!frm.fields_dict.sintering) return;
    const wrapper = frm.fields_dict.sintering.$wrapper;
    const data = sin_load_data(frm);

    const css = `
        <style>
            .sin-table { width:100%; border-collapse:collapse; table-layout:fixed; font-family:Arial,sans-serif; font-size:12px; margin-bottom:0; }
            .sin-table th, .sin-table td {
                border:1px solid #333; padding:4px 6px; text-align:center; vertical-align:middle;
            }
            .sin-table th { font-weight:normal; height:26px; }
            .sin-table .sin-left { text-align:left; }
            .sin-table .sin-title { font-size:16px; font-weight:bold; height:34px; }
            .sin-table .sin-rev { white-space:normal; word-break:break-word; }
            .sin-table td { overflow:hidden; }
            .sin-table input[type=date], .sin-table input[type=time] { min-width:0; font-size:11px; }
            .sin-table .sin-inline input { min-width:0; flex:1; }
            .sin-table .sin-material { font-size:16px; font-weight:bold; text-align:left; }
            .sin-table .sin-gap td { border:1px solid #333; height:14px; padding:0; }
            .sin-table input[type=text], .sin-table input[type=date], .sin-table input[type=time] {
                width:100%; box-sizing:border-box; border:none; background:transparent;
                font-family:inherit; font-size:12px; padding:2px; text-align:center; height:24px;
            }
            .sin-table .sin-left input { text-align:left; }
            .sin-table input:focus { outline:1px solid #5b9bd5; background:#fffbe6; }
            .sin-table .sin-inline { display:flex; align-items:center; gap:4px; }
            .sin-table .sin-inline span { white-space:nowrap; }
            .sin-table .sin-bold span { font-weight:bold; }
            .sin-table .sin-cross {
                background:
                    linear-gradient(to top right, transparent calc(50% - 0.6px), #000 50%, transparent calc(50% + 0.6px)),
                    linear-gradient(to top left, transparent calc(50% - 0.6px), #000 50%, transparent calc(50% + 0.6px)),
                    #808080;
            }
            .sin-table .sin-data-row td { height:30px; }
        </style>
    `;

    const inp = (key, type) =>
        `<input type="${type || 'text'}" data-key="${key}" value="${sin_esc(data[key])}">`;
    const cell = (key, left) =>
        `<td class="${left ? 'sin-left' : ''}">${inp(key)}</td>`;
    const labeled = (label, key, type, bold) =>
        `<div class="sin-inline ${bold ? 'sin-bold' : ''}"><span>${label}</span>${inp(key, type)}</div>`;

    const colgroup = `
        <colgroup>
            <col style="width:14%"><col style="width:12%"><col style="width:13%"><col style="width:9%">
            <col style="width:11%"><col style="width:11%"><col style="width:11%"><col style="width:19%">
        </colgroup>`;

    let trackRows = '';
    for (let i = 1; i <= SIN_ROWS_COUNT; i++) {
        trackRows += `<tr class="sin-data-row">
            ${cell(`r${i}_track`)}
            ${cell(`r${i}_wo`)}
            <td colspan="2">${inp(`r${i}_item`)}</td>
            ${cell(`r${i}_raw`)}
            ${cell(`r${i}_acc`)}
            ${cell(`r${i}_rej`)}
            ${cell(`r${i}_reason`)}
        </tr>`;
    }

    const cyc = sin_get_cycle(frm);
    const cycleRows = cyc.rows;
    const cycleNoText = (frm.doc.cycle_no || '').replace(/^Cycle\s*/i, '') || '1';
    const nCols = cyc.hours.length;
    const gridColgroup = `<colgroup><col style="width:14%"><col style="width:12%"><col style="width:13%">${
        `<col style="width:${(61 / nCols).toFixed(2)}%">`.repeat(nCols)}</colgroup>`;
    const halfSpan = Math.ceil((3 + nCols) / 2);
    let cycleHtml = '';
    cycleRows.forEach((r, idx) => {
        cycleHtml += `<tr class="sin-data-row">
            <td>${r.label}</td>`;
        if (idx === 0) {
            cycleHtml += `<td rowspan="${cycleRows.length}">As per graph<br>(Cycle No. ${sin_esc(cycleNoText)})</td>`;
        }
        cycleHtml += `<td>${r.time}</td>`;
        for (let c = 0; c < nCols; c++) {
            cycleHtml += c === r.col
                ? cell(`cycle_${idx + 1}_obs`)
                : `<td class="sin-cross"></td>`;
        }
        cycleHtml += `</tr>`;
    });
    const html = `
        ${css}
        <table class="sin-table">
            ${colgroup}
            <tbody>
                <tr>
                    <td colspan="7" class="sin-title">SET UP APPROVAL &amp; INPROCESS INSPECTION REPORT-SINTERING</td>
                    <td class="sin-rev">${cyc.rev}</td>
                </tr>
                <tr>
                    <td colspan="7" class="sin-material">Material:-${cyc.material}</td>
                    <td></td>
                </tr>
                <tr>
                    <td colspan="3" class="sin-left">${labeled('OVEN NO.:-', 'oven_no')}</td>
                    <td colspan="2" class="sin-left"><div class="sin-inline sin-bold"><span>CYCLE NO:-</span><span style="font-weight:normal">${sin_esc(frm.doc.cycle_no || '')}</span></div></td>
                    <td colspan="2" class="sin-left">${labeled('START DATE:-', 'start_date', 'date')}</td>
                    <td class="sin-left">${labeled('END DATE:-', 'end_date', 'date')}</td>
                </tr>
                <tr>
                    <td colspan="3" class="sin-left">${labeled('START TIME:-', 'start_time', 'time')}</td>
                    <td colspan="2" class="sin-left">${labeled('END TIME:-', 'end_time', 'time')}</td>
                    <td colspan="2" class="sin-left">${labeled('TOTAL CYCLE TIME:-', 'total_cycle_time')}</td>
                    <td></td>
                </tr>
                <tr class="sin-gap"><td colspan="8"></td></tr>
                <tr>
                    <th>TRACKSHEET NO.</th>
                    <th>WORK ORDER NO.</th>
                    <th colspan="2">ITEM DESCRIPTION</th>
                    <th>RAW MATERIAL</th>
                    <th>ACCEPTED QUANTITY</th>
                    <th>REJECTED QUANTITY</th>
                    <th>REJECTION REASON</th>
                </tr>
                ${trackRows}
                <tr class="sin-gap"><td colspan="8"></td></tr>
                <tr>
                    <th>Parameter</th>
                    <th>Specification</th>
                    <th>Measuring Method</th>
                    <th colspan="4">Observation</th>
                    <th>Remark</th>
                </tr>
                <tr class="sin-data-row" style="height:60px;">
                    <td>Bush Arrengement in oven tray</td>
                    <td>Vertical position &amp; distance between two bush 60 mm</td>
                    <td>Visual &amp; Distance piece</td>
                    <td colspan="4">${inp('bush_obs')}</td>
                    ${cell('bush_remark', true)}
                </tr>
                <tr class="sin-gap"><td colspan="8"></td></tr>
                </tbody>
                </table>
        
                <table class="sin-table">
                    ${gridColgroup}
                    <tbody>
                        <tr>
                            <th>PARAMETER</th>
                            <th>TEMPERATURE</th>
                            <th>TIME</th>
                            ${cyc.hours.map(h => `<th>${h}</th>`).join('')}
                        </tr>
                        ${cycleHtml}
                        <tr class="sin-gap"><td colspan="${3 + nCols}"></td></tr>
                        <tr>
                            <td colspan="${halfSpan}" class="sin-left">${labeled('MONITORED BY', 'monitored_by')}</td>
                            <td colspan="${3 + nCols - halfSpan}" class="sin-left">${labeled('REVIEWED BY', 'reviewed_by')}</td>
                        </tr>
                    </tbody>
                </table>
    `;

    wrapper.html(html);

    wrapper.find('input[data-key]').on('input change', function () {
        const key = $(this).attr('data-key');
        const current = sin_load_data(frm);
        current[key] = $(this).val();
        sin_save_data(frm, current);
    });
}