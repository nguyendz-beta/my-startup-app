import { Server } from 'socket.io'
import { Server as HttpServer } from 'http'
import jwt from 'jsonwebtoken'

const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret'

let io: Server

export const initSocket = (httpServer: HttpServer) => {
  io = new Server(httpServer, {
    cors: { origin: '*', methods: ['GET', 'POST'] },
  })

  io.use((socket, next) => {
    const token = socket.handshake.auth.token
    if (!token) return next(new Error('Không có token'))
    try {
      const decoded = jwt.verify(token, JWT_SECRET)
      ;(socket as any).user = decoded
      next()
    } catch {
      next(new Error('Token không hợp lệ'))
    }
  })

  io.on('connection', (socket) => {
    const user = (socket as any).user
    console.log(`Socket connected: ${user.userId} (${user.role})`)

    if (user.branchId) socket.join(`branch:${user.branchId}`)
    socket.join(`tenant:${user.tenantId}`)

    socket.on('disconnect', () => {
      console.log(`Socket disconnected: ${user.userId}`)
    })
  })

  return io
}

export const emitToRoom = (room: string, event: string, data: any) => {
  if (io) io.to(room).emit(event, data)
}