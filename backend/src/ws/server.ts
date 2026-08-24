import { WebSocketServer, WebSocket } from 'ws'
import { IncomingMessage, Server } from 'http'
import { JWT_SECRET } from '../middleware/auth.js'
import jwt from 'jsonwebtoken'

interface WsClient extends WebSocket {
  userId?: string
  role?: string
  facilityId?: string
  rooms: Set<string>
}

const clients = new Set<WsClient>()

export function initWebSocketServer(httpServer: Server) {
  const wss = new WebSocketServer({ server: httpServer, path: '/ws' })

  wss.on('connection', (ws: WsClient, req: IncomingMessage) => {
    ws.rooms = new Set()

    ws.on('message', (raw) => {
      try {
        const msg = JSON.parse(raw.toString()) as { type: string; [key: string]: unknown }

        switch (msg.type) {
          // Authenticate the WS connection
          case 'auth': {
            try {
              const payload = jwt.verify(msg.token as string, JWT_SECRET) as {
                userId: string; role: string; facilityId: string
              }
              ws.userId = payload.userId
              ws.role = payload.role
              ws.facilityId = payload.facilityId
              clients.add(ws)
              ws.send(JSON.stringify({ type: 'auth:ok', userId: ws.userId }))
            } catch {
              ws.send(JSON.stringify({ type: 'auth:error', message: 'Invalid token' }))
            }
            break
          }

          // Join a named room (teleconsult session, kiosk queue, etc.)
          case 'room:join': {
            ws.rooms.add(msg.room as string)
            ws.send(JSON.stringify({ type: 'room:joined', room: msg.room }))
            break
          }

          // Leave a room
          case 'room:leave': {
            ws.rooms.delete(msg.room as string)
            break
          }

          // WebRTC signaling relay
          case 'signal': {
            const { room, signal, targetUserId } = msg
            broadcastToRoom(room as string, { type: 'signal', signal, from: ws.userId }, ws, targetUserId as string | undefined)
            break
          }

          // Chat message in a teleconsult room
          case 'chat': {
            broadcastToRoom(msg.room as string, {
              type: 'chat',
              from: ws.userId,
              message: msg.message,
              timestamp: new Date().toISOString(),
            })
            break
          }

          default:
            break
        }
      } catch {
        // ignore malformed messages
      }
    })

    ws.on('close', () => {
      clients.delete(ws)
    })
  })

  console.log('✅ WebSocket server initialised on /ws')
  return wss
}

/** Broadcast an event to all authenticated clients */
export function broadcast(event: string, data: unknown) {
  const payload = JSON.stringify({ type: event, data, timestamp: new Date().toISOString() })
  for (const client of clients) {
    if (client.readyState === WebSocket.OPEN) {
      client.send(payload)
    }
  }
}

/** Broadcast to all clients in a specific room */
function broadcastToRoom(room: string, payload: unknown, exclude?: WebSocket, targetUserId?: string) {
  const msg = JSON.stringify(payload)
  for (const client of clients) {
    if (client === exclude) continue
    if (!client.rooms.has(room)) continue
    if (targetUserId && client.userId !== targetUserId) continue
    if (client.readyState === WebSocket.OPEN) {
      client.send(msg)
    }
  }
}

/** Broadcast to clients matching a facilityId */
export function broadcastToFacility(facilityId: string, event: string, data: unknown) {
  const payload = JSON.stringify({ type: event, data, timestamp: new Date().toISOString() })
  for (const client of clients) {
    if (client.facilityId === facilityId && client.readyState === WebSocket.OPEN) {
      client.send(payload)
    }
  }
}
