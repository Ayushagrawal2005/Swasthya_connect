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

interface RoomInfo {
  roomId: string
  participants: Set<string> // userId set
}

const clients = new Set<WsClient>()
const rooms = new Map<string, RoomInfo>() // Track room participants

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
            const roomId = msg.room as string
            ws.rooms.add(roomId)
            
            // Track room participants
            if (!rooms.has(roomId)) {
              rooms.set(roomId, { roomId, participants: new Set() })
            }
            const room = rooms.get(roomId)!
            room.participants.add(ws.userId!)
            
            // Notify user they joined
            ws.send(JSON.stringify({ type: 'room:joined', room: roomId }))
            
            // Notify existing participants that a new peer joined
            broadcastToRoom(roomId, { 
              type: 'peer:joined', 
              userId: ws.userId,
              room: roomId 
            }, ws)
            
            // Send list of existing participants to the new joiner
            const existingParticipants = Array.from(room.participants).filter(id => id !== ws.userId)
            if (existingParticipants.length > 0) {
              ws.send(JSON.stringify({ 
                type: 'room:participants', 
                room: roomId,
                participants: existingParticipants 
              }))
            }
            
            console.log(`[WebRTC] User ${ws.userId} joined room ${roomId}. Total participants: ${room.participants.size}`)
            break
          }

          // Leave a room
          case 'room:leave': {
            const roomId = msg.room as string
            ws.rooms.delete(roomId)
            
            // Remove from room participants
            const room = rooms.get(roomId)
            if (room) {
              room.participants.delete(ws.userId!)
              
              // Notify others that peer left
              broadcastToRoom(roomId, { 
                type: 'peer:left', 
                userId: ws.userId,
                room: roomId 
              }, ws)
              
              // Clean up empty rooms
              if (room.participants.size === 0) {
                rooms.delete(roomId)
                console.log(`[WebRTC] Room ${roomId} is empty, cleaned up`)
              }
            }
            
            console.log(`[WebRTC] User ${ws.userId} left room ${roomId}`)
            break
          }

          // WebRTC signaling relay (SDP offer/answer, ICE candidates)
          case 'signal': {
            const { room, signal, targetUserId } = msg
            
            // Relay signal to specific target or all in room
            broadcastToRoom(room as string, { 
              type: 'signal', 
              signal, 
              from: ws.userId,
              room 
            }, ws, targetUserId as string | undefined)
            
            console.log(`[WebRTC] Signal relayed from ${ws.userId} to ${targetUserId || 'all'} in room ${room}`)
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
      
      // Clean up user from all rooms
      if (ws.userId) {
        for (const [roomId, room] of rooms.entries()) {
          if (room.participants.has(ws.userId)) {
            room.participants.delete(ws.userId)
            
            // Notify others that peer disconnected
            broadcastToRoom(roomId, { 
              type: 'peer:left', 
              userId: ws.userId,
              room: roomId 
            })
            
            // Clean up empty rooms
            if (room.participants.size === 0) {
              rooms.delete(roomId)
            }
          }
        }
        console.log(`[WebRTC] User ${ws.userId} disconnected and cleaned up from all rooms`)
      }
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
