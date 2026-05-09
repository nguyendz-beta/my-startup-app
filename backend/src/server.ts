import http from 'http'
import app from './app'
import { initSocket } from './sockets/socketServer'

const PORT = process.env.PORT || 4000

const httpServer = http.createServer(app)
initSocket(httpServer)

httpServer.listen(PORT, () => {
  console.log(`Server listening on ${PORT}`)
})