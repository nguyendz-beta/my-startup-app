import { emitToRoom } from './socketServer'

export const orderEvents = {
  newOrder: (branchId: string, order: any) => {
    emitToRoom(`branch:${branchId}`, 'order:new', order)
  },
  orderStatusChanged: (branchId: string, order: any) => {
    emitToRoom(`branch:${branchId}`, 'order:status_changed', order)
  },
  orderPaid: (branchId: string, data: any) => {
    emitToRoom(`branch:${branchId}`, 'order:paid', data)
  },
  tableStatusChanged: (branchId: string, table: any) => {
    emitToRoom(`branch:${branchId}`, 'table:status_changed', table)
  },
}