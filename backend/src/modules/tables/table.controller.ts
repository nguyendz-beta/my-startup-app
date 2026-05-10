import { Request, Response } from 'express'
import { tableService } from './table.service'

const str = (v: any): string => Array.isArray(v) ? v[0] : v || ''

export const tableController = {
  async getTables(req: Request, res: Response) {
    try {
      const branchId = str(req.params.branchId) || (req as any).user?.branchId
      if (!branchId) return res.status(400).json({ success: false, message: 'Thiếu branchId' })
      const data = await tableService.getTables(branchId)
      return res.json({ success: true, data })
    } catch (e: any) {
      return res.status(400).json({ success: false, message: e.message })
    }
  },

  async createTable(req: Request, res: Response) {
    try {
      const branchId = str(req.params.branchId) || (req as any).user?.branchId
      const data = await tableService.createTable(branchId, req.body)
      return res.status(201).json({ success: true, data })
    } catch (e: any) {
      return res.status(400).json({ success: false, message: e.message })
    }
  },

  async updateTable(req: Request, res: Response) {
    try {
      const branchId = str(req.params.branchId) || (req as any).user?.branchId
      const data = await tableService.updateTable(branchId, str(req.params.tableId), req.body)
      return res.json({ success: true, data })
    } catch (e: any) {
      return res.status(400).json({ success: false, message: e.message })
    }
  },

  async deleteTable(req: Request, res: Response) {
    try {
      const branchId = str(req.params.branchId) || (req as any).user?.branchId
      await tableService.deleteTable(branchId, str(req.params.tableId))
      return res.json({ success: true, message: 'Đã xoá bàn' })
    } catch (e: any) {
      return res.status(400).json({ success: false, message: e.message })
    }
  },
}