import api from './axios'

export const orderApi = {
  getOrders: (branchId: string, params?: any) =>
    api.get(`/orders/branch/${branchId}`, { params }),
  getOrderById: (id: string) => api.get(`/orders/${id}`),
  createOrder: (data: any) => api.post('/orders', data),
  updateStatus: (id: string, status: string) =>
    api.patch(`/orders/${id}/status`, { status }),
  createPayment: (id: string, data: any) =>
    api.post(`/orders/${id}/payment`, data),
  cancelOrder: (id: string) => api.patch(`/orders/${id}/cancel`),
}