interface ReceiptProps {
  order: {
    orderCode: string;
    createdAt: string;
    source: string;
    paymentMethod?: string;
    table?: { name: string } | null;
    cashier?: { name: string } | null;
    items: {
      quantity: number;
      unitPrice: number;
      name: string;
      variantName?: string;
    }[];
    subtotal: number;
    discount: number;
    total: number;
    receivedAmount?: number;
    changeAmount?: number;
  };
  tenantName: string;
  branchName: string;
}

const SOURCE_LABEL: Record<string, string> = {
  DINE_IN: 'Tại bàn',
  TAKEAWAY: 'Mang đi',
  DELIVERY: 'Giao hàng',
  QR_ORDER: 'QR Order',
};

const METHOD_LABEL: Record<string, string> = {
  CASH: 'Tiền mặt',
  MOMO: 'MoMo',
  BANK: 'Chuyển khoản',
  CARD: 'Quẹt thẻ',
};

const fmt = (n: number) => new Intl.NumberFormat('vi-VN').format(n) + 'đ';
const fmtTime = (s: string) =>
  new Date(s).toLocaleString('vi-VN', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });

export function printReceipt(props: ReceiptProps) {
  const { order, tenantName, branchName } = props;

  const itemRows = order.items.map((item) => `
    <tr>
      <td style="padding:2px 0">${item.name}${item.variantName ? ` (${item.variantName})` : ''}</td>
      <td style="text-align:center;padding:2px 4px">${item.quantity}</td>
      <td style="text-align:right;padding:2px 0">${fmt(item.unitPrice * item.quantity)}</td>
    </tr>
  `).join('');

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8" />
      <title>Hóa đơn #${order.orderCode}</title>
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
          font-family: 'Courier New', monospace;
          font-size: 12px;
          width: 80mm;
          padding: 8px;
          color: #000;
        }
        .center { text-align: center; }
        .bold { font-weight: bold; }
        .large { font-size: 15px; }
        .divider { border-top: 1px dashed #000; margin: 6px 0; }
        table { width: 100%; border-collapse: collapse; }
        th { font-weight: bold; padding: 2px 0; border-bottom: 1px dashed #000; }
        .total-row td { font-weight: bold; font-size: 14px; padding-top: 4px; }
        .footer { text-align: center; margin-top: 8px; font-size: 11px; }
        @media print {
          @page { margin: 0; size: 80mm auto; }
          body { width: 80mm; }
        }
      </style>
    </head>
    <body>
      <div class="center bold large">${tenantName}</div>
      ${branchName ? `<div class="center" style="font-size:11px;color:#555">${branchName}</div>` : ''}
      <div class="divider"></div>

      <div class="bold center" style="font-size:13px">HÓA ĐƠN #${order.orderCode}</div>
      <div style="margin-top:4px">
        <div>Thời gian: ${fmtTime(order.createdAt)}</div>
        <div>Hình thức: ${SOURCE_LABEL[order.source] || order.source}</div>
        ${order.table ? `<div>Bàn: ${order.table.name}</div>` : ''}
        ${order.cashier ? `<div>Thu ngân: ${order.cashier.name}</div>` : ''}
        ${order.paymentMethod ? `<div>Thanh toán: ${METHOD_LABEL[order.paymentMethod] || order.paymentMethod}</div>` : ''}
      </div>

      <div class="divider"></div>

      <table>
        <thead>
          <tr>
            <th style="text-align:left">Món</th>
            <th style="text-align:center;width:28px">SL</th>
            <th style="text-align:right;width:70px">Tiền</th>
          </tr>
        </thead>
        <tbody>${itemRows}</tbody>
      </table>

      <div class="divider"></div>

      <table>
        <tr>
          <td>Tạm tính</td>
          <td style="text-align:right">${fmt(order.subtotal)}</td>
        </tr>
        ${order.discount > 0 ? `
        <tr>
          <td>Giảm giá</td>
          <td style="text-align:right">-${fmt(order.discount)}</td>
        </tr>` : ''}
        <tr class="total-row">
          <td>TỔNG CỘNG</td>
          <td style="text-align:right">${fmt(order.total)}</td>
        </tr>
        ${order.receivedAmount ? `
        <tr>
          <td>Tiền nhận</td>
          <td style="text-align:right">${fmt(order.receivedAmount)}</td>
        </tr>
        <tr>
          <td>Tiền thối</td>
          <td style="text-align:right">${fmt(order.changeAmount || 0)}</td>
        </tr>` : ''}
      </table>

      <div class="divider"></div>
      <div class="footer">Cảm ơn quý khách!</div>
      <div class="footer">Hẹn gặp lại lần sau ☕</div>
      <div style="height:16px"></div>
    </body>
    </html>
  `;

  const win = window.open('', '_blank', 'width=320,height=600');
  if (!win) return;
  win.document.write(html);
  win.document.close();
  win.focus();
  setTimeout(() => {
    win.print();
    win.close();
  }, 300);
}