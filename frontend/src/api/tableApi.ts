import api from './axios'

export const tableApi = {
  getTables: (branchId: string) => api.get(`/tables/branch/${branchId}`),
  createTable: (branchId: string, data: any) => api.post(`/tables/branch/${branchId}`, data),
  updateTable: (branchId: string, tableId: string, data: any) =>
    api.put(`/tables/branch/${branchId}/${tableId}`, data),
  deleteTable: (branchId: string, tableId: string) =>
    api.delete(`/tables/branch/${branchId}/${tableId}`),
}