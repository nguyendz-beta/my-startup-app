import prisma from '../../prisma/prismaClient'

export const productService = {
  // ── Categories ──────────────────────────────────────────

  async getCategories(tenantId: string) {
    return prisma.category.findMany({
      where: { tenantId, isActive: true },
      orderBy: { displayOrder: 'asc' },
      include: { _count: { select: { products: true } } },
    })
  },

  async createCategory(tenantId: string, data: { name: string; imageUrl?: string; displayOrder?: number }) {
    return prisma.category.create({
      data: { tenantId, ...data },
    })
  },

  async updateCategory(tenantId: string, categoryId: string, data: { name?: string; imageUrl?: string; displayOrder?: number; isActive?: boolean }) {
    const category = await prisma.category.findFirst({ where: { id: categoryId, tenantId } })
    if (!category) throw new Error('Danh mục không tồn tại')
    return prisma.category.update({ where: { id: categoryId }, data })
  },

  async deleteCategory(tenantId: string, categoryId: string) {
    const category = await prisma.category.findFirst({ where: { id: categoryId, tenantId } })
    if (!category) throw new Error('Danh mục không tồn tại')
    return prisma.category.update({ where: { id: categoryId }, data: { isActive: false } })
  },

  // ── Products ─────────────────────────────────────────────

  async getProducts(tenantId: string, filters?: { categoryId?: string; isAvailable?: boolean; search?: string }) {
    return prisma.product.findMany({
      where: {
        tenantId,
        ...(filters?.categoryId && { categoryId: filters.categoryId }),
        ...(filters?.isAvailable !== undefined && { isAvailable: filters.isAvailable }),
        ...(filters?.search && { name: { contains: filters.search } }),
      },
      orderBy: [{ categoryId: 'asc' }, { displayOrder: 'asc' }],
      include: {
        category: { select: { id: true, name: true } },
        variants: { where: { isAvailable: true }, orderBy: { name: 'asc' } },
      },
    })
  },

  async getProductById(tenantId: string, productId: string) {
    const product = await prisma.product.findFirst({
      where: { id: productId, tenantId },
      include: {
        category: true,
        variants: true,
      },
    })
    if (!product) throw new Error('Sản phẩm không tồn tại')
    return product
  },

  async createProduct(tenantId: string, data: {
    categoryId?: string
    name: string
    description?: string
    basePrice: number
    imageUrl?: string
    stockQuantity?: number
    displayOrder?: number
    variants?: { name: string; priceModifier: number }[]
  }) {
    const { variants, ...productData } = data
    return prisma.product.create({
      data: {
        tenantId,
        ...productData,
        variants: variants ? { createMany: { data: variants } } : undefined,
      },
      include: { variants: true, category: true },
    })
  },

  async updateProduct(tenantId: string, productId: string, data: {
    categoryId?: string
    name?: string
    description?: string
    basePrice?: number
    imageUrl?: string
    stockQuantity?: number
    displayOrder?: number
    isAvailable?: boolean
  }) {
    const product = await prisma.product.findFirst({ where: { id: productId, tenantId } })
    if (!product) throw new Error('Sản phẩm không tồn tại')
    return prisma.product.update({
      where: { id: productId },
      data,
      include: { variants: true, category: true },
    })
  },

  async deleteProduct(tenantId: string, productId: string) {
    const product = await prisma.product.findFirst({ where: { id: productId, tenantId } })
    if (!product) throw new Error('Sản phẩm không tồn tại')
    return prisma.product.update({ where: { id: productId }, data: { isAvailable: false } })
  },

  // ── Variants ─────────────────────────────────────────────

  async createVariant(tenantId: string, productId: string, data: { name: string; priceModifier: number }) {
    const product = await prisma.product.findFirst({ where: { id: productId, tenantId } })
    if (!product) throw new Error('Sản phẩm không tồn tại')
    return prisma.productVariant.create({ data: { productId, ...data } })
  },

  async updateVariant(tenantId: string, variantId: string, data: { name?: string; priceModifier?: number; isAvailable?: boolean }) {
    const variant = await prisma.productVariant.findFirst({
      where: { id: variantId, product: { tenantId } },
    })
    if (!variant) throw new Error('Variant không tồn tại')
    return prisma.productVariant.update({ where: { id: variantId }, data })
  },

  async deleteVariant(tenantId: string, variantId: string) {
    const variant = await prisma.productVariant.findFirst({
      where: { id: variantId, product: { tenantId } },
    })
    if (!variant) throw new Error('Variant không tồn tại')
    return prisma.productVariant.update({ where: { id: variantId }, data: { isAvailable: false } })
  },
}