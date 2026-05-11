import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

// ─── Color palette ────────────────────────────────────────────────────────────
const C = {
  headerBg: '1E3A5F',
  headerFg: 'FFFFFF',
  subHeaderBg: '2E86AB',
  subHeaderFg: 'FFFFFF',
  rowAlt: 'F0F4F8',
  rowWhite: 'FFFFFF',
  totalBg: 'FFE599',
  totalFg: '000000',
  borderColor: 'B0C4DE',
  titleBg: '0D1B2A',
  titleFg: 'FFFFFF',
};

type CellVal = string | number | boolean | Date;

// ─── Style helpers ────────────────────────────────────────────────────────────
function cellStyle(
  bgColor: string,
  fgColor: string,
  bold = false,
  hAlign: 'left' | 'center' | 'right' = 'left',
  fontSize = 11,
  numFmt?: string,
) {
  return {
    font: { bold, color: { rgb: fgColor }, sz: fontSize, name: 'Arial' },
    fill: { fgColor: { rgb: bgColor }, patternType: 'solid' as const },
    alignment: { horizontal: hAlign, vertical: 'center' as const, wrapText: true },
    border: {
      top: { style: 'thin' as const, color: { rgb: C.borderColor } },
      bottom: { style: 'thin' as const, color: { rgb: C.borderColor } },
      left: { style: 'thin' as const, color: { rgb: C.borderColor } },
      right: { style: 'thin' as const, color: { rgb: C.borderColor } },
    },
    ...(numFmt ? { numFmt } : {}),
  };
}

function hdr(label: string, bg = C.headerBg, fg = C.headerFg): XLSX.CellObject {
  return {
    v: label as CellVal,
    t: 's' as XLSX.ExcelDataType,
    s: cellStyle(bg, fg, true, 'center', 11),
  };
}

function cell(
  value: CellVal,
  type: XLSX.ExcelDataType = 's',
  alt = false,
  align: 'left' | 'center' | 'right' = 'left',
  numFmt?: string,
): XLSX.CellObject {
  return {
    v: value as CellVal,
    t: type as XLSX.ExcelDataType,
    s: cellStyle(alt ? C.rowAlt : C.rowWhite, C.totalFg, false, align, 11, numFmt),
  };
}

function totalCell(
  value: CellVal,
  type: XLSX.ExcelDataType = 'n',
  numFmt?: string,
): XLSX.CellObject {
  return {
    v: value as CellVal,
    t: type as XLSX.ExcelDataType,
    s: cellStyle(C.totalBg, C.totalFg, true, 'right', 11, numFmt),
  };
}

function pctCell(value: number, alt = false): XLSX.CellObject {
  return {
    v: value as CellVal,
    t: 'n' as XLSX.ExcelDataType,
    s: cellStyle(alt ? C.rowAlt : C.rowWhite, C.totalFg, false, 'right', 11, '0.0%'),
  };
}

function pctTotal(value: number): XLSX.CellObject {
  return {
    v: value as CellVal,
    t: 'n' as XLSX.ExcelDataType,
    s: cellStyle(C.totalBg, C.totalFg, true, 'right', 11, '0.0%'),
  };
}

function addRow(ws: XLSX.WorkSheet, ref: { r: number; c: number }, cells: XLSX.CellObject[]) {
  cells.forEach((c, ci) => {
    const addr = XLSX.utils.encode_cell({ r: ref.r, c: ref.c + ci });
    ws[addr] = c;
  });
  ref.r++;
}

function setRange(ws: XLSX.WorkSheet, maxR: number, maxC: number) {
  ws['!ref'] = XLSX.utils.encode_range({ r: 0, c: 0 }, { r: maxR - 1, c: maxC - 1 });
}

function mergeTitle(ws: XLSX.WorkSheet, text: string, cols: number, row: number) {
  ws[XLSX.utils.encode_cell({ r: row, c: 0 })] = {
    v: text as CellVal,
    t: 's' as XLSX.ExcelDataType,
    s: cellStyle(C.titleBg, C.titleFg, true, 'center', 14),
  };
  ws['!merges'] = ws['!merges'] || [];
  ws['!merges'].push({ s: { r: row, c: 0 }, e: { r: row, c: cols - 1 } });
}

// ─── Currency formatter ───────────────────────────────────────────────────────
const VND_FMT = '#,##0\\ "đ"';
function vndCell(v: number, alt = false): XLSX.CellObject {
  return cell(v, 'n', alt, 'right', VND_FMT);
}
function vndTotal(v: number): XLSX.CellObject {
  return totalCell(v, 'n', VND_FMT);
}

// ─── SHEET 1: Tổng quan ───────────────────────────────────────────────────────
function buildSummarySheet(summary: any, range: string, weekLabel?: string): XLSX.WorkSheet {
  const ws: XLSX.WorkSheet = {};
  const ref = { r: 0, c: 0 };
  const COLS = 4;

  mergeTitle(
    ws,
    `📊 BÁO CÁO TỔNG QUAN — ${range}${weekLabel ? ' | ' + weekLabel : ''}`,
    COLS,
    ref.r,
  );
  ref.r++;
  ref.r++;

  addRow(ws, ref, [
    hdr('CHỈ SỐ', C.subHeaderBg, C.subHeaderFg),
    hdr('GIÁ TRỊ', C.subHeaderBg, C.subHeaderFg),
    hdr('CHỈ SỐ', C.subHeaderBg, C.subHeaderFg),
    hdr('GIÁ TRỊ', C.subHeaderBg, C.subHeaderFg),
  ]);

  const kpis: [string, number | string][] = [
    ['Tổng doanh thu', summary.totalRevenue ?? 0],
    ['Tổng đơn hàng', summary.totalOrders ?? 0],
    ['Giá trị TB / đơn', summary.avgOrderValue ?? 0],
    ['Tổng khách hàng', summary.totalCustomers ?? 0],
    ['Doanh thu tiền mặt', summary.cashRevenue ?? 0],
    ['Doanh thu chuyển khoản', summary.transferRevenue ?? 0],
    ['Đơn hàng tại quán', summary.dineInOrders ?? 0],
    ['Đơn hàng mang về', summary.takeawayOrders ?? 0],
    ['Đơn hàng online', summary.onlineOrders ?? 0],
    ['Hủy đơn', summary.canceledOrders ?? 0],
  ];

  // ── FIX: check isVndKey cho cả cột trái lẫn cột phải ──
  const isVndKey = (label: string) =>
    ['doanh thu', 'giá trị tb'].some((k) => label.toLowerCase().includes(k));

  for (let i = 0; i < kpis.length; i += 2) {
    const alt = (i / 2) % 2 === 1;
    const [lLabel, lVal] = kpis[i];
    const [rLabel, rVal] = kpis[i + 1] ?? ['—', '—'];

    addRow(ws, ref, [
      cell(String(lLabel), 's', alt, 'left'),
      isVndKey(String(lLabel)) && typeof lVal === 'number'
        ? vndCell(lVal, alt)
        : cell(lVal as CellVal, typeof lVal === 'number' ? 'n' : 's', alt, 'right'),
      cell(String(rLabel), 's', alt, 'left'),
      isVndKey(String(rLabel)) && typeof rVal === 'number'
        ? vndCell(rVal as number, alt)
        : typeof rVal === 'number'
          ? cell(rVal, 'n', alt, 'right')
          : cell(rVal as CellVal, 's', alt, 'right'),
    ]);
  }

  ws['!cols'] = [{ wch: 28 }, { wch: 20 }, { wch: 28 }, { wch: 20 }];
  setRange(ws, ref.r, COLS);
  return ws;
}

// ─── SHEET 2: Doanh thu theo ngày ─────────────────────────────────────────────
function buildRevenueSheet(revenue: any[]): XLSX.WorkSheet {
  const ws: XLSX.WorkSheet = {};
  const ref = { r: 0, c: 0 };
  const COLS = 5;

  mergeTitle(ws, '📈 DOANH THU THEO NGÀY', COLS, ref.r);
  ref.r++;
  ref.r++;

  addRow(ws, ref, [
    hdr('NGÀY'),
    hdr('DOANH THU', C.subHeaderBg, C.subHeaderFg),
    hdr('SỐ ĐƠN', C.subHeaderBg, C.subHeaderFg),
    hdr('TB / ĐƠN', C.subHeaderBg, C.subHeaderFg),
    hdr('GHI CHÚ', C.subHeaderBg, C.subHeaderFg),
  ]);

  let totalRev = 0;
  let totalOrders = 0;

  revenue.forEach((r, i) => {
    const alt = i % 2 === 1;
    const avg = (r.orders ?? 0) > 0 ? (r.revenue ?? 0) / r.orders : 0;
    totalRev += r.revenue ?? 0;
    totalOrders += r.orders ?? 0;

    addRow(ws, ref, [
      cell(String(r.date ?? r.label ?? `Ngày ${i + 1}`), 's', alt, 'center'),
      vndCell(r.revenue ?? 0, alt),
      cell(r.orders ?? 0, 'n', alt, 'right'),
      vndCell(avg, alt),
      cell(String(r.note ?? ''), 's', alt),
    ]);
  });

  addRow(ws, ref, [
    totalCell('TỔNG CỘNG', 's'),
    vndTotal(totalRev),
    totalCell(totalOrders, 'n'),
    vndTotal(totalOrders > 0 ? totalRev / totalOrders : 0),
    totalCell('', 's'),
  ]);

  ws['!cols'] = [{ wch: 16 }, { wch: 20 }, { wch: 12 }, { wch: 20 }, { wch: 20 }];
  setRange(ws, ref.r, COLS);
  return ws;
}

// ─── SHEET 3: Top sản phẩm ────────────────────────────────────────────────────
function buildTopProductsSheet(products: any[]): XLSX.WorkSheet {
  const ws: XLSX.WorkSheet = {};
  const ref = { r: 0, c: 0 };
  const COLS = 6;

  mergeTitle(ws, '🏆 TOP SẢN PHẨM BÁN CHẠY', COLS, ref.r);
  ref.r++;
  ref.r++;

  addRow(ws, ref, [
    hdr('HẠNG'),
    hdr('SẢN PHẨM'),
    hdr('SỐ LƯỢNG', C.subHeaderBg, C.subHeaderFg),
    hdr('DOANH THU', C.subHeaderBg, C.subHeaderFg),
    hdr('TB / CỐC', C.subHeaderBg, C.subHeaderFg),
    hdr('TỶ LỆ %', C.subHeaderBg, C.subHeaderFg),
  ]);

  const totalRev = products.reduce((s, p) => s + (p.revenue ?? 0), 0);
  let totalQty = 0;
  let totalRevSum = 0;

  products.forEach((p, i) => {
    const alt = i % 2 === 1;
    const pct = totalRev > 0 ? (p.revenue ?? 0) / totalRev : 0;
    const avg = (p.quantity ?? 0) > 0 ? (p.revenue ?? 0) / (p.quantity ?? 1) : 0;
    totalQty += p.quantity ?? 0;
    totalRevSum += p.revenue ?? 0;
    const medal = i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : String(i + 1);

    addRow(ws, ref, [
      cell(medal, 's', alt, 'center'),
      cell(String(p.name ?? p.product ?? '—'), 's', alt),
      cell(p.quantity ?? 0, 'n', alt, 'right'),
      vndCell(p.revenue ?? 0, alt),
      vndCell(avg, alt),
      pctCell(pct, alt),
    ]);
  });

  addRow(ws, ref, [
    totalCell('TỔNG', 's'),
    totalCell('', 's'),
    totalCell(totalQty, 'n'),
    vndTotal(totalRevSum),
    vndTotal(totalQty > 0 ? totalRevSum / totalQty : 0),
    pctTotal(1),
  ]);

  ws['!cols'] = [{ wch: 8 }, { wch: 28 }, { wch: 12 }, { wch: 20 }, { wch: 20 }, { wch: 10 }];
  setRange(ws, ref.r, COLS);
  return ws;
}

// ─── SHEET 4: Theo phương thức thanh toán ─────────────────────────────────────
function buildPaymentSheet(byPayment: any[]): XLSX.WorkSheet {
  const ws: XLSX.WorkSheet = {};
  const ref = { r: 0, c: 0 };
  const COLS = 5;

  mergeTitle(ws, '💳 DOANH THU THEO PHƯƠNG THỨC THANH TOÁN', COLS, ref.r);
  ref.r++;
  ref.r++;

  addRow(ws, ref, [
    hdr('PHƯƠNG THỨC'),
    hdr('SỐ ĐƠN', C.subHeaderBg, C.subHeaderFg),
    hdr('DOANH THU', C.subHeaderBg, C.subHeaderFg),
    hdr('TB / ĐƠN', C.subHeaderBg, C.subHeaderFg),
    hdr('TỶ LỆ %', C.subHeaderBg, C.subHeaderFg),
  ]);

  const totalRev = byPayment.reduce((s, p) => s + (p.revenue ?? 0), 0);
  let sumOrders = 0;
  let sumRev = 0;

  byPayment.forEach((p, i) => {
    const alt = i % 2 === 1;
    const pct = totalRev > 0 ? (p.revenue ?? 0) / totalRev : 0;
    const avg = (p.orders ?? 0) > 0 ? (p.revenue ?? 0) / (p.orders ?? 1) : 0;
    sumOrders += p.orders ?? 0;
    sumRev += p.revenue ?? 0;

    addRow(ws, ref, [
      cell(String(p.method ?? p.name ?? '—'), 's', alt),
      cell(p.orders ?? 0, 'n', alt, 'right'),
      vndCell(p.revenue ?? 0, alt),
      vndCell(avg, alt),
      pctCell(pct, alt),
    ]);
  });

  addRow(ws, ref, [
    totalCell('TỔNG', 's'),
    totalCell(sumOrders, 'n'),
    vndTotal(sumRev),
    vndTotal(sumOrders > 0 ? sumRev / sumOrders : 0),
    pctTotal(1),
  ]);

  ws['!cols'] = [{ wch: 24 }, { wch: 12 }, { wch: 20 }, { wch: 20 }, { wch: 10 }];
  setRange(ws, ref.r, COLS);
  return ws;
}

// ─── SHEET 5: Theo nguồn đơn ──────────────────────────────────────────────────
function buildSourceSheet(bySource: any[]): XLSX.WorkSheet {
  const ws: XLSX.WorkSheet = {};
  const ref = { r: 0, c: 0 };
  const COLS = 5;

  mergeTitle(ws, '📦 DOANH THU THEO NGUỒN ĐƠN HÀNG', COLS, ref.r);
  ref.r++;
  ref.r++;

  addRow(ws, ref, [
    hdr('NGUỒN'),
    hdr('SỐ ĐƠN', C.subHeaderBg, C.subHeaderFg),
    hdr('DOANH THU', C.subHeaderBg, C.subHeaderFg),
    hdr('TB / ĐƠN', C.subHeaderBg, C.subHeaderFg),
    hdr('TỶ LỆ %', C.subHeaderBg, C.subHeaderFg),
  ]);

  const totalRev = bySource.reduce((s, x) => s + (x.revenue ?? 0), 0);
  let sumO = 0,
    sumR = 0;

  bySource.forEach((x, i) => {
    const alt = i % 2 === 1;
    const pct = totalRev > 0 ? (x.revenue ?? 0) / totalRev : 0;
    const avg = (x.orders ?? 0) > 0 ? (x.revenue ?? 0) / (x.orders ?? 1) : 0;
    sumO += x.orders ?? 0;
    sumR += x.revenue ?? 0;

    addRow(ws, ref, [
      cell(String(x.source ?? x.name ?? '—'), 's', alt),
      cell(x.orders ?? 0, 'n', alt, 'right'),
      vndCell(x.revenue ?? 0, alt),
      vndCell(avg, alt),
      pctCell(pct, alt),
    ]);
  });

  addRow(ws, ref, [
    totalCell('TỔNG', 's'),
    totalCell(sumO, 'n'),
    vndTotal(sumR),
    vndTotal(sumO > 0 ? sumR / sumO : 0),
    pctTotal(1),
  ]);

  ws['!cols'] = [{ wch: 22 }, { wch: 12 }, { wch: 20 }, { wch: 20 }, { wch: 10 }];
  setRange(ws, ref.r, COLS);
  return ws;
}

// ─── SHEET 6: Theo nhân viên ──────────────────────────────────────────────────
function buildStaffSheet(byStaff: any[]): XLSX.WorkSheet {
  const ws: XLSX.WorkSheet = {};
  const ref = { r: 0, c: 0 };
  const COLS = 6;

  mergeTitle(ws, '👤 DOANH THU THEO NHÂN VIÊN', COLS, ref.r);
  ref.r++;
  ref.r++;

  addRow(ws, ref, [
    hdr('NHÂN VIÊN'),
    hdr('SỐ ĐƠN', C.subHeaderBg, C.subHeaderFg),
    hdr('DOANH THU', C.subHeaderBg, C.subHeaderFg),
    hdr('TB / ĐƠN', C.subHeaderBg, C.subHeaderFg),
    hdr('TỶ LỆ %', C.subHeaderBg, C.subHeaderFg),
    hdr('HIỆU SUẤT', C.subHeaderBg, C.subHeaderFg),
  ]);

  const totalRev = byStaff.reduce((s, x) => s + (x.revenue ?? 0), 0);
  const maxRev = Math.max(...byStaff.map((x) => x.revenue ?? 0), 1);
  let sumO = 0,
    sumR = 0;

  byStaff.forEach((x, i) => {
    const alt = i % 2 === 1;
    const pct = totalRev > 0 ? (x.revenue ?? 0) / totalRev : 0;
    const avg = (x.orders ?? 0) > 0 ? (x.revenue ?? 0) / (x.orders ?? 1) : 0;
    const perf = (x.revenue ?? 0) / maxRev;
    const perfBar = '█'.repeat(Math.round(perf * 10)) + '░'.repeat(10 - Math.round(perf * 10));
    sumO += x.orders ?? 0;
    sumR += x.revenue ?? 0;

    addRow(ws, ref, [
      cell(String(x.staff ?? x.name ?? '—'), 's', alt),
      cell(x.orders ?? 0, 'n', alt, 'right'),
      vndCell(x.revenue ?? 0, alt),
      vndCell(avg, alt),
      pctCell(pct, alt),
      cell(perfBar, 's', alt, 'left'),
    ]);
  });

  addRow(ws, ref, [
    totalCell('TỔNG', 's'),
    totalCell(sumO, 'n'),
    vndTotal(sumR),
    vndTotal(sumO > 0 ? sumR / sumO : 0),
    pctTotal(1),
    totalCell('', 's'),
  ]);

  ws['!cols'] = [{ wch: 22 }, { wch: 12 }, { wch: 20 }, { wch: 20 }, { wch: 10 }, { wch: 16 }];
  setRange(ws, ref.r, COLS);
  return ws;
}

// ─── SHEET 7: Phân tích giờ cao điểm ─────────────────────────────────────────
function buildPeakHoursSheet(revenue: any[]): XLSX.WorkSheet {
  const ws: XLSX.WorkSheet = {};
  const ref = { r: 0, c: 0 };
  const COLS = 4;

  mergeTitle(ws, '⏰ PHÂN TÍCH GIỜ CAO ĐIỂM (ước tính)', COLS, ref.r);
  ref.r++;
  ref.r++;

  addRow(ws, ref, [
    hdr('KHUNG GIỜ'),
    hdr('ĐƠN ƯỚC TÍNH', C.subHeaderBg, C.subHeaderFg),
    hdr('DOANH THU ƯỚC TÍNH', C.subHeaderBg, C.subHeaderFg),
    hdr('MỨC ĐỘ', C.subHeaderBg, C.subHeaderFg),
  ]);

  const slots = [
    { label: '06:00 – 08:00', weight: 0.1 },
    { label: '08:00 – 10:00', weight: 0.2 },
    { label: '10:00 – 12:00', weight: 0.15 },
    { label: '12:00 – 14:00', weight: 0.18 },
    { label: '14:00 – 16:00', weight: 0.1 },
    { label: '16:00 – 18:00', weight: 0.12 },
    { label: '18:00 – 20:00', weight: 0.1 },
    { label: '20:00 – 22:00', weight: 0.05 },
  ];

  const totalOrders = revenue.reduce((s, r) => s + (r.orders ?? 0), 0);
  const totalRev = revenue.reduce((s, r) => s + (r.revenue ?? 0), 0);

  slots.forEach((s, i) => {
    const alt = i % 2 === 1;
    const estOrders = Math.round(totalOrders * s.weight);
    const estRev = totalRev * s.weight;
    const level =
      s.weight >= 0.18
        ? '🔴 Rất cao'
        : s.weight >= 0.12
          ? '🟡 Cao'
          : s.weight >= 0.08
            ? '🟢 Trung bình'
            : '⚪ Thấp';

    addRow(ws, ref, [
      cell(s.label, 's', alt, 'center'),
      cell(estOrders, 'n', alt, 'right'),
      vndCell(estRev, alt),
      cell(level, 's', alt, 'center'),
    ]);
  });

  ws['!cols'] = [{ wch: 20 }, { wch: 18 }, { wch: 22 }, { wch: 16 }];
  setRange(ws, ref.r, COLS);
  return ws;
}

// ─── Main export function ─────────────────────────────────────────────────────
export function exportExcel(data: {
  summary: any;
  revenue: any[];
  topProducts: any[];
  byPayment: any[];
  bySource: any[];
  byStaff: any[];
  range: string;
  weekLabel?: string;
}) {
  const wb = XLSX.utils.book_new();

  XLSX.utils.book_append_sheet(
    wb,
    buildSummarySheet(data.summary, data.range, data.weekLabel),
    '📊 Tổng quan',
  );
  XLSX.utils.book_append_sheet(wb, buildRevenueSheet(data.revenue), '📈 Doanh thu ngày');
  XLSX.utils.book_append_sheet(wb, buildTopProductsSheet(data.topProducts), '🏆 Top sản phẩm');
  XLSX.utils.book_append_sheet(wb, buildPaymentSheet(data.byPayment), '💳 Thanh toán');
  XLSX.utils.book_append_sheet(wb, buildSourceSheet(data.bySource), '📦 Nguồn đơn');
  XLSX.utils.book_append_sheet(wb, buildStaffSheet(data.byStaff), '👤 Nhân viên');
  XLSX.utils.book_append_sheet(wb, buildPeakHoursSheet(data.revenue), '⏰ Giờ cao điểm');

  const fileName = `BaoCao_${data.range.replace(/\s/g, '_')}_${Date.now()}.xlsx`;
  XLSX.writeFile(wb, fileName, { bookType: 'xlsx', compression: true });
}

// ─── PDF export ───────────────────────────────────────────────────────────────
export function exportPDF(data: {
  summary: any;
  revenue: any[];
  topProducts: any[];
  byPayment: any[];
  bySource: any[];
  range: string;
  weekLabel?: string;
}) {
  const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
  const fmt = (n: number) =>
    new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(n);

  doc.setFontSize(18);
  doc.setTextColor(30, 58, 95);
  doc.text(
    `BÁO CÁO KINH DOANH — ${data.range}${data.weekLabel ? ' | ' + data.weekLabel : ''}`,
    148,
    16,
    { align: 'center' },
  );

  doc.setFontSize(11);
  doc.setTextColor(0);
  autoTable(doc, {
    startY: 22,
    head: [['Chỉ số', 'Giá trị']],
    body: [
      ['Tổng doanh thu', fmt(data.summary.totalRevenue ?? 0)],
      ['Tổng đơn hàng', String(data.summary.totalOrders ?? 0)],
      ['Trung bình / đơn', fmt(data.summary.avgOrderValue ?? 0)],
    ],
    theme: 'grid',
    headStyles: { fillColor: [30, 58, 95], textColor: 255, fontStyle: 'bold' },
    alternateRowStyles: { fillColor: [240, 244, 248] },
    tableWidth: 80,
    margin: { left: 10 },
  });

  const afterKpi = (doc as any).lastAutoTable.finalY + 8;
  autoTable(doc, {
    startY: afterKpi,
    head: [['Ngày', 'Doanh thu', 'Số đơn']],
    body: data.revenue.map((r) => [
      String(r.date ?? r.label ?? ''),
      fmt(r.revenue ?? 0),
      String(r.orders ?? 0),
    ]),
    theme: 'grid',
    headStyles: { fillColor: [46, 134, 171], textColor: 255, fontStyle: 'bold' },
    alternateRowStyles: { fillColor: [240, 244, 248] },
  });

  const afterRev = (doc as any).lastAutoTable.finalY + 8;
  autoTable(doc, {
    startY: afterRev,
    head: [['#', 'Sản phẩm', 'Số lượng', 'Doanh thu']],
    body: data.topProducts
      .slice(0, 10)
      .map((p, i) => [
        String(i + 1),
        String(p.name ?? p.product ?? '—'),
        String(p.quantity ?? 0),
        fmt(p.revenue ?? 0),
      ]),
    theme: 'grid',
    headStyles: { fillColor: [30, 58, 95], textColor: 255, fontStyle: 'bold' },
    alternateRowStyles: { fillColor: [240, 244, 248] },
  });

  const fileName = `BaoCao_${data.range.replace(/\s/g, '_')}_${Date.now()}.pdf`;
  doc.save(fileName);
}
