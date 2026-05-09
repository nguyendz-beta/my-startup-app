import api from './axios'

export const productApi = {
  getCategories: () => api.get('/products/categories'),
  createCategory: (data: any) => api.post('/products/categories', data),
  updateCategory: (id: string, data: any) => api.put(`/products/categories/${id}`, data),
  deleteCategory: (id: string) => api.delete(`/products/categories/${id}`),

  getProducts: (params?: any) => api.get('/products', { params }),
  getProductById: (id: string) => api.get(`/products/${id}`),
  createProduct: (data: any) => api.post('/products', data),
  updateProduct: (id: string, data: any) => api.put(`/products/${id}`, data),
  deleteProduct: (id: string) => api.delete(`/products/${id}`),

  createVariant: (productId: string, data: any) => api.post(`/products/${productId}/variants`, data),
  updateVariant: (variantId: string, data: any) => api.put(`/products/variants/${variantId}`, data),
  deleteVariant: (variantId: string) => api.delete(`/products/variants/${variantId}`),
}