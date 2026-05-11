import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

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
  const fmt = (n: number) => n.toLocaleString('vi-VN');

  // Sheet 1: Tổng quan
  const summaryRows = [
    ['Chỉ số', 'Doanh thu', 'Số đơn'],
    ['Hôm nay', fmt(data.summary?.today?.revenue || 0), data.summary?.today?.orders || 0],
    ['Tuần này', fmt(data.summary?.thisWeek?.revenue || 0), data.summary?.thisWeek?.orders || 0],
    ['Tháng này', fmt(data.summary?.thisMonth?.revenue || 0), data.summary?.thisMonth?.orders || 0],
    ['Năm nay', fmt(data.summary?.thisYear?.revenue || 0), data.summary?.thisYear?.orders || 0],
  ];
  XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(summaryRows), 'Tổng quan');

  // Sheet 2: Doanh thu theo ngày/tháng
  const revenueRows = [
    [data.range === 'year' ? 'Tháng' : 'Ngày', 'Doanh thu (đ)', 'Số đơn'],
    ...data.revenue.map((d) => [
      data.range === 'year' ? `Tháng ${d.month}` : d.date,
      d.revenue,
      d.orders,
    ]),
  ];
  XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(revenueRows), 'Doanh thu');

  // Sheet 3: Top sản phẩm
  const productRows = [
    ['#', 'Tên món', 'Số lượng', 'Doanh thu (đ)'],
    ...data.topProducts.map((p, i) => [i + 1, p.name, p.quantity, p.revenue]),
  ];
  XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(productRows), 'Top món');

  // Sheet 4: Thanh toán
  const paymentLabel: Record<string, string> = {
    CASH: 'Tiền mặt',
    CARD: 'Thẻ',
    MOMO: 'MoMo',
    TRANSFER: 'Chuyển khoản',
  };
  const paymentRows = [
    ['Phương thức', 'Doanh thu (đ)', 'Số đơn'],
    ...data.byPayment.map((p) => [paymentLabel[p.method] || p.method, p.revenue, p.orders]),
  ];
  XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(paymentRows), 'Thanh toán');

  // Sheet 5: Nhân viên
  const staffRows = [
    ['Nhân viên', 'Doanh thu (đ)', 'Số đơn'],
    ...data.byStaff.map((s) => [s.name, s.revenue, s.orders]),
  ];
  XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(staffRows), 'Nhân viên');

  const fileName = `BaoCao_${data.weekLabel || data.range}_${new Date().toLocaleDateString('vi-VN').replace(/\//g, '-')}.xlsx`;
  XLSX.writeFile(wb, fileName);
}

export function exportPDF(data: {
  summary: any;
  revenue: any[];
  topProducts: any[];
  byPayment: any[];
  bySource: any[];
  byStaff: any[];
  range: string;
  weekLabel?: string;
}) {
  const doc = new jsPDF();
  const fmt = (n: number) => n.toLocaleString('vi-VN') + 'đ';
  const paymentLabel: Record<string, string> = {
    CASH: 'Tiền mặt',
    CARD: 'Thẻ',
    MOMO: 'MoMo',
    TRANSFER: 'Chuyển khoản',
  };
  const sourceLabel: Record<string, string> = {
    DINE_IN: 'Tại bàn',
    TAKEAWAY: 'Mang đi',
    DELIVERY: 'Giao hàng',
    QR_ORDER: 'QR Order',
  };

  let y = 15;

  // Tiêu đề
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text('BAO CAO DOANH THU', 105, y, { align: 'center' });
  y += 7;
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(
    `Ky: ${data.weekLabel || data.range} | Xuat ngay: ${new Date().toLocaleDateString('vi-VN')}`,
    105,
    y,
    { align: 'center' },
  );
  y += 10;

  // Tổng quan
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('TONG QUAN', 14, y);
  y += 4;
  autoTable(doc, {
    startY: y,
    head: [['Chi so', 'Doanh thu', 'So don']],
    body: [
      ['Hom nay', fmt(data.summary?.today?.revenue || 0), String(data.summary?.today?.orders || 0)],
      [
        'Tuan nay',
        fmt(data.summary?.thisWeek?.revenue || 0),
        String(data.summary?.thisWeek?.orders || 0),
      ],
      [
        'Thang nay',
        fmt(data.summary?.thisMonth?.revenue || 0),
        String(data.summary?.thisMonth?.orders || 0),
      ],
      [
        'Nam nay',
        fmt(data.summary?.thisYear?.revenue || 0),
        String(data.summary?.thisYear?.orders || 0),
      ],
    ],
    theme: 'striped',
    headStyles: { fillColor: [249, 115, 22] },
  });

  // Top sản phẩm
  // @ts-ignore
  y = doc.lastAutoTable.finalY + 8;
  doc.setFont('helvetica', 'bold');
  doc.text('TOP MON BAN CHAY', 14, y);
  y += 4;
  autoTable(doc, {
    startY: y,
    head: [['#', 'Ten mon', 'So luong', 'Doanh thu']],
    body: data.topProducts.map((p, i) => [
      String(i + 1),
      p.name,
      String(p.quantity),
      fmt(p.revenue),
    ]),
    theme: 'striped',
    headStyles: { fillColor: [249, 115, 22] },
  });

  // Thanh toán
  // @ts-ignore
  y = doc.lastAutoTable.finalY + 8;
  doc.setFont('helvetica', 'bold');
  doc.text('PHUONG THUC THANH TOAN', 14, y);
  y += 4;
  autoTable(doc, {
    startY: y,
    head: [['Phuong thuc', 'Doanh thu', 'So don']],
    body: data.byPayment.map((p) => [
      paymentLabel[p.method] || p.method,
      fmt(p.revenue),
      String(p.orders),
    ]),
    theme: 'striped',
    headStyles: { fillColor: [249, 115, 22] },
  });

  // Nhân viên
  // @ts-ignore
  y = doc.lastAutoTable.finalY + 8;
  doc.setFont('helvetica', 'bold');
  doc.text('THEO NHAN VIEN', 14, y);
  y += 4;
  autoTable(doc, {
    startY: y,
    head: [['Nhan vien', 'Doanh thu', 'So don']],
    body: data.byStaff.map((s) => [s.name, fmt(s.revenue), String(s.orders)]),
    theme: 'striped',
    headStyles: { fillColor: [249, 115, 22] },
  });

  // Nguồn đơn
  // @ts-ignore
  y = doc.lastAutoTable.finalY + 8;
  if (y > 250) {
    doc.addPage();
    y = 15;
  }
  doc.setFont('helvetica', 'bold');
  doc.text('NGUON DON HANG', 14, y);
  y += 4;
  autoTable(doc, {
    startY: y,
    head: [['Nguon', 'So don', 'Doanh thu']],
    body: data.bySource.map((s) => [
      sourceLabel[s.source] || s.source,
      String(s.orders),
      fmt(s.revenue),
    ]),
    theme: 'striped',
    headStyles: { fillColor: [249, 115, 22] },
  });

  const fileName = `BaoCao_${data.weekLabel || data.range}_${new Date().toLocaleDateString('vi-VN').replace(/\//g, '-')}.pdf`;
  doc.save(fileName);
}
