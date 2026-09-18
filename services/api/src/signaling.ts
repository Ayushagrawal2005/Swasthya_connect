/**
 * WebRTC Signaling Server with Socket.IO
 * Handles peer-to-peer connection establishment for video calls
 */

import { Server as SocketIOServer } from 'socket.io'
import type { Server as HTTPServer } from 'http'

interface Room {
  participants: Set<string>
  createdAt: Date
}

interface SignalData {
  signal: any
  from: string
  to: string
  room: string
}

interface JoinRoomData {
  room: string
  userId: string
  isInitiator?: boolean
}

interface TeleconsultRequest {
  sessionId: string
  ashaId: string
  ashaName: string
  patientId: string
  patientName: string
  triageData?: any
  timestamp: number
}

export function setupSignalingServer(httpServer: HTTPServer) {
  const io = new SocketIOServer(httpServer, {
    cors: {
      origin: '*', // In production, restrict to your frontend domain
      methods: ['GET', 'POST'],
      credentials: true
    },
    path: '/socket.io/',
    transports: ['websocket', 'polling']
  })

  const rooms = new Map<string, Room>()
  const userToSocket = new Map<string, string>()
  const socketToUser = new Map<string, string>()
  const pendingTeleconsults = new Map<string, TeleconsultRequest>() // Teleconsult queue
  const doctorSockets = new Set<string>() // Track doctor connections

  io.on('connection', (socket) => {
    console.log(`🔌 WebRTC client connected: ${socket.id}`)

    // Handle authentication
    socket.on('auth', (data: { token?: string; userId?: string }) => {
      const userId = data.userId || socket.id
      userToSocket.set(userId, socket.id)
      socketToUser.set(socket.id, userId)
      socket.emit('authenticated', { userId })
      console.log(`✅ User authenticated: ${userId}`)
    })

    // Handle joining a room
    socket.on('join-room', (data: JoinRoomData) => {
      const { room, userId, isInitiator } = data

      // Leave any previous room
      socket.rooms.forEach(r => {
        if (r !== socket.id) {
          socket.leave(r)
        }
      })

      // Join the new room
      socket.join(room)

      // Create room if it doesn't exist
      if (!rooms.has(room)) {
        rooms.set(room, {
          participants: new Set(),
          createdAt: new Date()
        })
      }

      const roomData = rooms.get(room)!
      roomData.participants.add(userId)

      console.log(`👥 User ${userId} joined room ${room}. Total participants: ${roomData.participants.size}`)

      // Notify others in the room
      socket.to(room).emit('peer-joined', {
        userId,
        isInitiator: roomData.participants.size === 1
      })

      // Send current participants to the joining user
      socket.emit('room-joined', {
        room,
        participants: Array.from(roomData.participants).filter(id => id !== userId),
        isInitiator: roomData.participants.size === 1
      })
    })

    // Handle WebRTC signaling
    socket.on('signal', (data: SignalData) => {
      const { signal, from, to, room } = data
      
      console.log(`📡 Relaying signal from ${from} to ${to} in room ${room}`)
      
      // If 'to' is specified, send to that specific peer
      if (to) {
        const targetSocketId = userToSocket.get(to)
        if (targetSocketId) {
          io.to(targetSocketId).emit('signal', {
            signal,
            from,
            room
          })
        }
      } else {
        // Broadcast to all in room except sender
        socket.to(room).emit('signal', {
          signal,
          from,
          room
        })
      }
    })

    // Handle leaving a room
    socket.on('leave-room', (data: { room: string; userId: string }) => {
      const { room, userId } = data
      
      socket.leave(room)
      
      const roomData = rooms.get(room)
      if (roomData) {
        roomData.participants.delete(userId)
        
        // Notify others
        socket.to(room).emit('peer-left', { userId })
        
        // Clean up empty rooms
        if (roomData.participants.size === 0) {
          rooms.delete(room)
          console.log(`🗑️ Room ${room} deleted (empty)`)
        } else {
          console.log(`👋 User ${userId} left room ${room}. Remaining: ${roomData.participants.size}`)
        }
      }
    })

    // ═══════════════════════════════════════════════════════════════
    // TELECONSULT QUEUE HANDLERS
    // ═══════════════════════════════════════════════════════════════

    // Register as doctor (to receive notifications)
    socket.on('register-doctor', (data: { doctorId: string }) => {
      doctorSockets.add(socket.id)
      console.log(`👨‍⚕️ Doctor registered: ${data.doctorId} (socket: ${socket.id})`)
      
      // Send current queue to newly connected doctor
      const currentQueue = Array.from(pendingTeleconsults.values())
      socket.emit('teleconsult-queue', currentQueue)
    })

    // ASHA requests teleconsult
    socket.on('request-teleconsult', (data: Omit<TeleconsultRequest, 'timestamp'>) => {
      const request: TeleconsultRequest = {
        ...data,
        timestamp: Date.now()
      }
      
      pendingTeleconsults.set(request.sessionId, request)
      console.log(`📞 New teleconsult request: ${request.patientName} (Session: ${request.sessionId})`)
      
      // Notify all connected doctors
      doctorSockets.forEach(docSocketId => {
        io.to(docSocketId).emit('new-teleconsult-request', request)
      })
      
      // Confirm to ASHA
      socket.emit('request-confirmed', { sessionId: request.sessionId })
    })

    // Doctor accepts teleconsult
    socket.on('accept-teleconsult', (data: { sessionId: string; doctorId: string; doctorName: string }) => {
      const request = pendingTeleconsults.get(data.sessionId)
      
      if (request) {
        console.log(`✅ Doctor ${data.doctorName} accepted teleconsult ${data.sessionId}`)
        
        // Notify ASHA that doctor accepted
        const ashaSocketId = userToSocket.get(request.ashaId)
        if (ashaSocketId) {
          io.to(ashaSocketId).emit('doctor-accepted', {
            doctorId: data.doctorId,
            doctorName: data.doctorName,
            sessionId: data.sessionId
          })
        }
        
        // Remove from queue
        pendingTeleconsults.delete(data.sessionId)
        
        // Notify all doctors that this request was accepted
        doctorSockets.forEach(docSocketId => {
          io.to(docSocketId).emit('teleconsult-accepted', { sessionId: data.sessionId })
        })
        
        // Confirm to accepting doctor
        socket.emit('accept-confirmed', { sessionId: data.sessionId })
      } else {
        socket.emit('accept-failed', { sessionId: data.sessionId, error: 'Request not found or already accepted' })
      }
    })

    // Cancel teleconsult request
    socket.on('cancel-teleconsult', (data: { sessionId: string }) => {
      if (pendingTeleconsults.has(data.sessionId)) {
        pendingTeleconsults.delete(data.sessionId)
        console.log(`❌ Teleconsult cancelled: ${data.sessionId}`)
        
        // Notify all doctors
        doctorSockets.forEach(docSocketId => {
          io.to(docSocketId).emit('teleconsult-cancelled', { sessionId: data.sessionId })
        })
      }
    })

    // Handle disconnect
    socket.on('disconnect', () => {
      const userId = socketToUser.get(socket.id)
      
      // Remove from doctor sockets if was a doctor
      doctorSockets.delete(socket.id)
      
      if (userId) {
        userToSocket.delete(userId)
        socketToUser.delete(socket.id)

        // Remove from all rooms
        rooms.forEach((roomData, roomName) => {
          if (roomData.participants.has(userId)) {
            roomData.participants.delete(userId)
            socket.to(roomName).emit('peer-left', { userId })
            
            if (roomData.participants.size === 0) {
              rooms.delete(roomName)
            }
          }
        })

        console.log(`🔌 User ${userId} disconnected`)
      }
    })

    // Handle ICE candidate exchange
    socket.on('ice-candidate', (data: { candidate: any; to: string; room: string }) => {
      const { candidate, to, room } = data
      
      if (to) {
        const targetSocketId = userToSocket.get(to)
        if (targetSocketId) {
          io.to(targetSocketId).emit('ice-candidate', {
            candidate,
            from: socketToUser.get(socket.id),
            room
          })
        }
      } else {
        socket.to(room).emit('ice-candidate', {
          candidate,
          from: socketToUser.get(socket.id),
          room
        })
      }
    })

    // Handle chat messages during call
    socket.on('chat-message', (data: { room: string; message: string; from: string }) => {
      socket.to(data.room).emit('chat-message', data)
    })

    // Handle connection quality updates
    socket.on('quality-update', (data: { room: string; quality: any }) => {
      socket.to(data.room).emit('quality-update', {
        from: socketToUser.get(socket.id),
        quality: data.quality
      })
    })
  })

  console.log('✅ WebRTC Signaling Server initialized')
  
  return io
}
