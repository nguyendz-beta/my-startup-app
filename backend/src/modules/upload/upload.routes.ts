import { Router } from 'express'
import multer from 'multer'
import path from 'path'
import fs from 'fs'
import * as XLSX from 'xlsx'
import { authMiddleware } from '../../middlewares/authMiddleware'
import prisma from '../../prisma/prismaClient'

const router = Router()

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = path.join(__dirname, '../../../uploads/images')
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true })
    cb(null, dir)
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname)
    cb(null, `${Date.now()}-${Math.random().toString(36).slice(2)}${ext}`)
  },
})

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) cb(null, true)
    else cb(new Error('Chỉ chấp nhận file ảnh'))
  },
})

// Upload ảnh
router.post('/image', authMiddleware, upload.single('image'), (req, res) => {
  const file = (req as any).file
  if (!file) { res.status(400).json({ message: 'Không có file' }); return }
  const url = `/uploads/images/${file.filename}`
  res.json({ url })
})

// Upload Excel nhập kho
const excelUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const ok = file.mimetype.includes('spreadsheet') ||
      file.mimetype.includes('excel') ||
      file.originalname.endsWith('.xlsx') ||
      file.originalname.endsWith('.xls')
    if (ok) cb(null, true)
    else cb(new Error('Chỉ chấp nhận file Excel (.xlsx, .xls)'))
  },
})

router.post('/inventory-excel', authMiddleware, excelUpload.single('file'), async (req, res) => {
  try {
    const user = (req as any).user
    const file = (req as any).file
    if (!file) return res.status(400).json({ success: false, message: 'Không có file' })

    // Lấy branchId
    let branchId = req.body.branchId || user.branchId
    if (!branchId) {
      const branch = await prisma.branch.findFirst({ where: { tenantId: user.tenantId } })
      if (!branch) return res.status(400).json({ success: false, message: 'Không tìm thấy chi nhánh' })
      branchId = branch.id
    }

    // Đọc Excel
    const workbook = XLSX.read(file.buffer, { type: 'buffer' })
    const sheet = workbook.Sheets[workbook.SheetNames[0]]
    const rows: any[] = XLSX.utils.sheet_to_json(sheet)

    if (rows.length === 0) {
      return res.status(400).json({ success: false, message: 'File Excel trống' })
    }

    const db = prisma as any
    let created = 0
    let updated = 0
    const errors: string[] = []

    for (const row of rows) {
      try {
        const name = row['Tên nguyên liệu'] || row['name'] || row['ten']
        if (!name) continue

        const quantity = parseFloat(row['Số lượng'] || row['quantity'] || 0)
        const minQuantity = parseFloat(row['Tối thiểu'] || row['minQuantity'] || 10)
        const costPrice = parseFloat(row['Giá nhập'] || row['costPrice'] || 0)
        const unit = row['Đơn vị'] || row['unit'] || 'kg'
        const category = row['Danh mục'] || row['category'] || null

        // Kiểm tra đã tồn tại chưa
        const existing = await db.inventoryItem.findFirst({
          where: { branchId, name: { equals: name } }
        })

        if (existing) {
          await db.inventoryItem.update({
            where: { id: existing.id },
            data: { quantity: existing.quantity + quantity, minQuantity, costPrice, unit, category }
          })
          await db.inventoryItemLog.create({
            data: { itemId: existing.id, type: 'IN', quantity, note: 'Nhập từ Excel', createdBy: user.name || 'Excel' }
          })
          updated++
        } else {
          const item = await db.inventoryItem.create({
            data: { branchId, name, unit, quantity, minQuantity, costPrice, category }
          })
          if (quantity > 0) {
            await db.inventoryItemLog.create({
              data: { itemId: item.id, type: 'IN', quantity, note: 'Nhập từ Excel', createdBy: user.name || 'Excel' }
            })
          }
          created++
        }
      } catch (err: any) {
        errors.push(`Dòng ${rows.indexOf(row) + 2}: ${err.message}`)
      }
    }

    return res.json({
      success: true,
      message: `Đã thêm ${created} mới, cập nhật ${updated} nguyên liệu`,
      created, updated, errors
    })
  } catch (e: any) {
    return res.status(400).json({ success: false, message: e.message })
  }
})

export default router