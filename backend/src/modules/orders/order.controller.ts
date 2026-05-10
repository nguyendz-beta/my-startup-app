import { Request, Response } from 'express'
import { orderService } from './order.service'

const str = (v: any): string => Array.isArray(v) ? v[0] : v || ''

export const orderController = {
  async getOrders(req: Request, res: Response) {
    try {
      const branchId = str(req.params.branchId) || (req as any).user?.branchId
      const data = await orderService.getOrders(branchId, {
        status: str(req.query.status),
        source: str(req.query.source),
        date: str(req.query.date),
      })
      return res.json({ success: true, data })
    } catch (e: any) {
      return res.status(400).json({ success: false, message: e.message })
    }
  },

  async getOrderById(req: Request, res: Response) {
    try {
      const branchId = (req as any).user?.branchId
      const data = await orderService.getOrderById(branchId, str(req.params.id))
      return res.json({ success: true, data })
    } catch (e: any) {
      return res.status(404).json({ success: false, message: e.message })
    }
  },

  async createOrder(req: Request, res: Response) {
    try {
      const user = (req as any).user
      const data = await orderService.createOrder(user.branchId, user.userId, req.body)
      return res.status(201).json({ success: true, data })
    } catch (e: any) {
      return res.status(400).json({ success: false, message: e.message })
    }
  },

  async updateOrderStatus(req: Request, res: Response) {
    try {
      const branchId = (req as any).user?.branchId
      const data = await orderService.updateOrderStatus(branchId, str(req.params.id), req.body.status)
      return res.json({ success: true, data })
    } catch (e: any) {
      return res.status(400).json({ success: false, message: e.message })
    }
  },

  async createPayment(req: Request, res: Response) {
    try {
      const branchId = (req as any).user?.branchId
      const data = await orderService.createPayment(branchId, str(req.params.id), req.body)
      return res.json({ success: true, data })
    } catch (e: any) {
      return res.status(400).json({ success: false, message: e.message })
    }
  },

  async cancelOrder(req: Request, res: Response) {
    try {
      const branchId = (req as any).user?.branchId
      await orderService.cancelOrder(branchId, str(req.params.id))
      return res.json({ success: true, message: 'Đã huỷ đơn hàng' })
    } catch (e: any) {
      return res.status(400).json({ success: false, message: e.message })
    }
  },
}