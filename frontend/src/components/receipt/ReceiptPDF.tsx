import { Document, Page, Text, View, StyleSheet, PDFDownloadLink } from '@react-pdf/renderer'

const styles = StyleSheet.create({
  page: { padding: 30, fontSize: 10, fontFamily: 'Helvetica' },
  center: { textAlign: 'center' },
  title: { fontSize: 16, fontWeight: 'bold', textAlign: 'center', marginBottom: 4 },
  subtitle: { fontSize: 10, textAlign: 'center', color: '#666', marginBottom: 12 },
  divider: { borderBottom: '1px dashed #ccc', marginVertical: 8 },
  row: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 3 },
  bold: { fontFamily: 'Helvetica-Bold' },
  itemName: { flex: 1 },
  itemQty: { width: 30, textAlign: 'center' },
  itemPrice: { width: 70, textAlign: 'right' },
  total: { fontSize: 12, fontFamily: 'Helvetica-Bold' },
  footer: { textAlign: 'center', color: '#888', fontSize: 9, marginTop: 12 },
})

interface ReceiptProps {
  order: {
    orderCode: string
    createdAt: string
    source: string
    table?: { name: string } | null
    cashier?: { name: string } | null
    items: {
      quantity: number
      unitPrice: number
      product: { name: string }
      variant?: { name: string } | null
    }[]
    subtotal: number
    discount: number
    total: number
  }
  tenantName: string
  branchName: string
}

const SOURCE_LABEL: Record<string, string> = {
  DINE_IN: 'Tại bàn',
  TAKEAWAY: 'Mang đi',
  DELIVERY: 'Giao hàng',
  QR_ORDER: 'QR Order',
}

const fmt = (n: number) =>
  new Intl.NumberFormat('vi-VN').format(n) + 'd'

const fmtTime = (s: string) =>
  new Date(s).toLocaleString('vi-VN', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })

export function ReceiptDocument({ order, tenantName, branchName }: ReceiptProps) {
  return (
    <Document>
      <Page size={[220, 'auto']} style={styles.page}>
        <Text style={styles.title}>{tenantName}</Text>
        <Text style={styles.subtitle}>{branchName}</Text>
        <View style={styles.divider} />

        <View style={styles.row}>
          <Text style={styles.bold}>Hoa don #{order.orderCode}</Text>
        </View>
        <View style={styles.row}>
          <Text style={{ color: '#666' }}>{fmtTime(order.createdAt)}</Text>
        </View>
        <View style={styles.row}>
          <Text>Hinh thuc: {SOURCE_LABEL[order.source] || order.source}</Text>
        </View>
        {order.table && (
          <View style={styles.row}>
            <Text>Ban: {order.table.name}</Text>
          </View>
        )}
        {order.cashier && (
          <View style={styles.row}>
            <Text>Thu ngan: {order.cashier.name}</Text>
          </View>
        )}

        <View style={styles.divider} />

        <View style={[styles.row, { marginBottom: 6 }]}>
          <Text style={[styles.bold, styles.itemName]}>Mon</Text>
          <Text style={[styles.bold, styles.itemQty]}>SL</Text>
          <Text style={[styles.bold, styles.itemPrice]}>Tien</Text>
        </View>

        {order.items.map((item, i) => (
          <View key={i} style={styles.row}>
            <Text style={styles.itemName}>
              {item.product.name}
              {item.variant ? ` (${item.variant.name})` : ''}
            </Text>
            <Text style={styles.itemQty}>{item.quantity}</Text>
            <Text style={styles.itemPrice}>{fmt(item.unitPrice * item.quantity)}</Text>
          </View>
        ))}

        <View style={styles.divider} />

        <View style={styles.row}>
          <Text>Tam tinh</Text>
          <Text>{fmt(order.subtotal)}</Text>
        </View>
        {order.discount > 0 && (
          <View style={styles.row}>
            <Text>Giam gia</Text>
            <Text>-{fmt(order.discount)}</Text>
          </View>
        )}
        <View style={[styles.row, { marginTop: 4 }]}>
          <Text style={styles.total}>TONG CONG</Text>
          <Text style={styles.total}>{fmt(order.total)}</Text>
        </View>

        <View style={styles.divider} />
        <Text style={styles.footer}>Cam on quy khach!</Text>
        <Text style={styles.footer}>Hen gap lai lan sau</Text>
      </Page>
    </Document>
  )
}

interface ReceiptButtonProps {
  order: ReceiptProps['order']
  tenantName: string
  branchName: string
}

export function ReceiptDownloadButton({ order, tenantName, branchName }: ReceiptButtonProps) {
  return (
    <PDFDownloadLink
      document={<ReceiptDocument order={order} tenantName={tenantName} branchName={branchName} />}
      fileName={`hoadon-${order.orderCode}.pdf`}
    >
      {({ loading }) => (
        <button className="flex items-center gap-2 bg-gray-800 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-700">
          🖨️ {loading ? 'Đang tạo...' : 'In hóa đơn'}
        </button>
      )}
    </PDFDownloadLink>
  )
}
