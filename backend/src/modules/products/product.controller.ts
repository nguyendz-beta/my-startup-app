import { Request, Response } from 'express'
import { productService } from './product.service'

const getTenantId = (req: Request) => (req as any).user.tenantId

export const productController = {
  // Categories
  async getCategories(req: Request, res: Response) {
    try {
      const data = await productService.getCategories(getTenantId(req))
      return res.json({ success: true, data })
    } catch (e: any) {
      return res.status(400).json({ success: false, message: e.message })
    }
  },

  async createCategory(req: Request, res: Response) {
    try {
      const data = await productService.createCategory(getTenantId(req), req.body)
      return res.status(201).json({ success: true, data })
    } catch (e: any) {
      return res.status(400).json({ success: false, message: e.message })
    }
  },

  async updateCategory(req: Request, res: Response) {
    try {
      const data = await productService.updateCategory(getTenantId(req), req.params.id, req.body)
      return res.json({ success: true, data })
    } catch (e: any) {
      return res.status(400).json({ success: false, message: e.message })
    }
  },

  async deleteCategory(req: Request, res: Response) {
    try {
      await productService.deleteCategory(getTenantId(req), req.params.id)
      return res.json({ success: true, message: 'Đã xoá danh mục' })
    } catch (e: any) {
      return res.status(400).json({ success: false, message: e.message })
    }
  },

  // Products
  async getProducts(req: Request, res: Response) {
    try {
      const { categoryId, isAvailable, search } = req.query
      const data = await productService.getProducts(getTenantId(req), {
        categoryId: categoryId as string,
        isAvailable: isAvailable === 'true' ? true : isAvailable === 'false' ? false : undefined,
        search: search as string,
      })
      return res.json({ success: true, data })
    } catch (e: any) {
      return res.status(400).json({ success: false, message: e.message })
    }
  },

  async getProductById(req: Request, res: Response) {
    try {
      const data = await productService.getProductById(getTenantId(req), req.params.id)
      return res.json({ success: true, data })
    } catch (e: any) {
      return res.status(404).json({ success: false, message: e.message })
    }
  },

  async createProduct(req: Request, res: Response) {
    try {
      const data = await productService.createProduct(getTenantId(req), req.body)
      return res.status(201).json({ success: true, data })
    } catch (e: any) {
      return res.status(400).json({ success: false, message: e.message })
    }
  },

  async updateProduct(req: Request, res: Response) {
    try {
      const data = await productService.updateProduct(getTenantId(req), req.params.id, req.body)
      return res.json({ success: true, data })
    } catch (e: any) {
      return res.status(400).json({ success: false, message: e.message })
    }
  },

  async deleteProduct(req: Request, res: Response) {
    try {
      await productService.deleteProduct(getTenantId(req), req.params.id)
      return res.json({ success: true, message: 'Đã xoá sản phẩm' })
    } catch (e: any) {
      return res.status(400).json({ success: false, message: e.message })
    }
  },

  // Variants
  async createVariant(req: Request, res: Response) {
    try {
      const data = await productService.createVariant(getTenantId(req), req.params.productId, req.body)
      return res.status(201).json({ success: true, data })
    } catch (e: any) {
      return res.status(400).json({ success: false, message: e.message })
    }
  },

  async updateVariant(req: Request, res: Response) {
    try {
      const data = await productService.updateVariant(getTenantId(req), req.params.variantId, req.body)
      return res.json({ success: true, data })
    } catch (e: any) {
      return res.status(400).json({ success: false, message: e.message })
    }
  },

  async deleteVariant(req: Request, res: Response) {
    try {
      await productService.deleteVariant(getTenantId(req), req.params.variantId)
      return res.json({ success: true, message: 'Đã xoá variant' })
    } catch (e: any) {
      return res.status(400).json({ success: false, message: e.message })
    }
  },
}