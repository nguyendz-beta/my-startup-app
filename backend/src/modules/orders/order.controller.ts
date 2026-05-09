import { Request, Response } from 'express'
import { orderService } from './order.service'

export const orderController = {
  async getOrders(req: Request, res: Response) {
    try {
      const branchId = req.params.branchId || (req as any).user.branchId
      const { status, source, date } = req.query
      const data = await orderService.getOrders(branchId, {
        status: status as string,
        source: source as string,
        date: date as string,
      })
      return res.json({ success: true, data })
    } catch (e: any) {
      return res.status(400).json({ success: false, message: e.message })
    }
  },

  async getOrderById(req: Request, res: Response) {
    try {
      const branchId = (req as any).user.branchId
      const data = await orderService.getOrderById(branchId, req.params.id)
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
      const branchId = (req as any).user.branchId
      const data = await orderService.updateOrderStatus(branchId, req.params.id, req.body.status)
      return res.json({ success: true, data })
    } catch (e: any) {
      return res.status(400).json({ success: false, message: e.message })
    }
  },

  async createPayment(req: Request, res: Response) {
    try {
      const branchId = (req as any).user.branchId
      const data = await orderService.createPayment(branchId, req.params.id, req.body)
      return res.json({ success: true, data })
    } catch (e: any) {
      return res.status(400).json({ success: false, message: e.message })
    }
  },

  async cancelOrder(req: Request, res: Response) {
    try {
      const branchId = (req as any).user.branchId
      await orderService.cancelOrder(branchId, req.params.id)
      return res.json({ success: true, message: 'Đã huỷ đơn hàng' })
    } catch (e: any) {
      return res.status(400).json({ success: false, message: e.message })
    }
  },
}