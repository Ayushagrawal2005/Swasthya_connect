/**
 * WebRTC Service using Socket.IO for signaling
 * Handles camera access, peer connections with proper error handling
 */

import { io, Socket } from 'socket.io-client'
import SimplePeer from 'simple-peer'

export interface ConnectionQuality {
  bandwidth: number
  packetLoss: number
  latency: number
  quality: 'excellent' | 'good' | 'fair' | 'poor' | 'critical'
}

interface PeerConnection {
  peer: SimplePeer.Instance
  userId: string
}

const ICE_SERVERS = [
  { urls: 'stun:stun.l.google.com:19302' },
  { urls: 'stun:stun1.l.google.com:19302' },
]

class WebRTCService {
  private socket: Socket | null = null
  private localStream: MediaStream | null = null
  private peers = new Map<string, PeerConnection>()
  private currentRoom: string | null = null
  private userId: string | null = null
  
  // Event handlers
  public onRemoteStream?: (userId: string, stream: MediaStream) => void
  public onPeerConnected?: (userId: string) => void
  public onPeerDisconnected?: (userId: string) => void
  public onConnectionQualityChange?: (quality: ConnectionQuality) => void
  public onError?: (error: Error) => void

  /**
   * Connect to signaling server
   */
  async connect(serverUrl: string, token: string, userId: string): Promise<void> {
    try {
      this.userId = userId
      
      // Extract base URL and use port 4000
      const baseUrl = serverUrl.split('/')[2].split(':')[0]
      const socketUrl = `http://${baseUrl}:4000`
      
      console.log('🔌 Connecting to signaling server:', socketUrl)
      
      this.socket = io(socketUrl, {
        transports: ['websocket', 'polling'],
        reconnection: true,
        reconnectionAttempts: 5,
        reconnectionDelay: 1000,
      })

      return new Promise((resolve, reject) => {
        if (!this.socket) {
          reject(new Error('Socket initialization failed'))
          return
        }

        const timeout = setTimeout(() => {
          reject(new Error('Connection timeout'))
        }, 10000)

        this.socket.on('connect', () => {
          clearTimeout(timeout)
          console.log('✅ Connected to signaling server')
          
          // Authenticate
          this.socket?.emit('auth', { token, userId })
        })

        this.socket.on('authenticated', () => {
          console.log('✅ Authenticated with signaling server')
          this.setupSocketListeners()
          resolve()
        })

        this.socket.on('connect_error', (error) => {
          clearTimeout(timeout)
          console.error('❌ Connection error:', error)
          reject(error)
        })

        this.socket.on('error', (error) => {
          console.error('❌ Socket error:', error)
          this.onError?.(new Error(error))
        })
      })
    } catch (error: any) {
      console.error('❌ Failed to connect to signaling server:', error)
      this.onError?.(error)
      throw error
    }
  }

  /**
   * Setup socket event listeners
   */
  private setupSocketListeners() {
    if (!this.socket) return

    // Handle peer joining
    this.socket.on('peer-joined', ({ userId, isInitiator }) => {
      console.log('👤 Peer joined:', userId, 'Initiator:', isInitiator)
      this.createPeerConnection(userId, !isInitiator)
    })

    // Handle peer leaving
    this.socket.on('peer-left', ({ userId }) => {
      console.log('👋 Peer left:', userId)
      this.removePeer(userId)
      this.onPeerDisconnected?.(userId)
    })

    // Handle WebRTC signals
    this.socket.on('signal', ({ signal, from }) => {
      console.log('📡 Received signal from:', from)
      const peer = this.peers.get(from)
      if (peer) {
        try {
          peer.peer.signal(signal)
        } catch (error) {
          console.error('❌ Error processing signal:', error)
        }
      } else {
        // Peer doesn't exist yet, create it
        this.createPeerConnection(from, false)
        setTimeout(() => {
          const newPeer = this.peers.get(from)
          if (newPeer) {
            newPeer.peer.signal(signal)
          }
        }, 100)
      }
    })

    // Handle ICE candidates
    this.socket.on('ice-candidate', ({ candidate, from }) => {
      const peer = this.peers.get(from)
      if (peer && candidate) {
        peer.peer.signal({ candidate })
      }
    })

    // Handle room joined
    this.socket.on('room-joined', ({ room, participants, isInitiator }) => {
      console.log('✅ Joined room:', room, 'Participants:', participants, 'Initiator:', isInitiator)
      
      // Create peer connections for existing participants
      participants.forEach((participantId: string) => {
        this.createPeerConnection(participantId, isInitiator)
      })
    })
  }

  /**
   * Create peer connection
   */
  private createPeerConnection(userId: string, initiator: boolean) {
    if (this.peers.has(userId)) {
      console.log('⚠️ Peer connection already exists for:', userId)
      return
    }

    if (!this.localStream) {
      console.error('❌ No local stream available')
      return
    }

    console.log('🔗 Creating peer connection with:', userId, 'Initiator:', initiator)

    try {
      const peer = new SimplePeer({
        initiator,
        stream: this.localStream,
        trickle: true,
        config: { iceServers: ICE_SERVERS }
      })

      // Handle signals
      peer.on('signal', (signal) => {
        console.log('📤 Sending signal to:', userId)
        this.socket?.emit('signal', {
          signal,
          from: this.userId,
          to: userId,
          room: this.currentRoom
        })
      })

      // Handle stream
      peer.on('stream', (stream) => {
        console.log('📹 Received stream from:', userId)
        this.onRemoteStream?.(userId, stream)
      })

      // Handle connection
      peer.on('connect', () => {
        console.log('✅ Peer connected:', userId)
        this.onPeerConnected?.(userId)
      })

      // Handle errors
      peer.on('error', (error) => {
        console.error('❌ Peer error with', userId, ':', error)
        this.onError?.(error)
      })

      // Handle close
      peer.on('close', () => {
        console.log('🔌 Peer connection closed:', userId)
        this.removePeer(userId)
        this.onPeerDisconnected?.(userId)
      })

      this.peers.set(userId, { peer, userId })
    } catch (error: any) {
      console.error('❌ Failed to create peer connection:', error)
      this.onError?.(error)
    }
  }

  /**
   * Remove peer connection
   */
  private removePeer(userId: string) {
    const peerConn = this.peers.get(userId)
    if (peerConn) {
      try {
        peerConn.peer.destroy()
      } catch (error) {
        console.error('Error destroying peer:', error)
      }
      this.peers.delete(userId)
    }
  }

  /**
   * Get local media stream with error handling
   */
  async getLocalStream(constraints?: MediaStreamConstraints): Promise<MediaStream> {
    try {
      const defaultConstraints: MediaStreamConstraints = {
        video: {
          width: { ideal: 1280 },
          height: { ideal: 720 },
          facingMode: 'user'
        },
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        }
      }

      console.log('🎥 Requesting camera and microphone access...')
      
      const stream = await navigator.mediaDevices.getUserMedia(
        constraints || defaultConstraints
      )
      
      this.localStream = stream
      console.log('✅ Local stream obtained')
      
      return stream
    } catch (error: any) {
      console.error('❌ Failed to get local stream:', error)
      
      // User-friendly error messages
      let message = 'Failed to access camera/microphone'
      if (error.name === 'NotAllowedError' || error.name === 'PermissionDeniedError') {
        message = 'Camera/microphone permission denied. Please allow access in browser settings.'
      } else if (error.name === 'NotFoundError' || error.name === 'DevicesNotFoundError') {
        message = 'No camera or microphone found. Please connect a device.'
      } else if (error.name === 'NotReadableError' || error.name === 'TrackStartError') {
        message = 'Camera/microphone is already in use by another application.'
      }
      
      const err = new Error(message)
      this.onError?.(err)
      throw err
    }
  }

  /**
   * Join a room
   */
  async joinRoom(roomId: string, isInitiator: boolean = false): Promise<void> {
    if (!this.socket || !this.socket.connected) {
      throw new Error('Not connected to signaling server')
    }

    this.currentRoom = roomId
    
    console.log('🚪 Joining room:', roomId)
    
    this.socket.emit('join-room', {
      room: roomId,
      userId: this.userId,
      isInitiator
    })
  }

  /**
   * Leave current room
   */
  leaveRoom() {
    if (this.socket && this.currentRoom) {
      console.log('🚪 Leaving room:', this.currentRoom)
      
      this.socket.emit('leave-room', {
        room: this.currentRoom,
        userId: this.userId
      })

      // Cleanup all peer connections
      this.peers.forEach((_, userId) => this.removePeer(userId))
      this.peers.clear()
      
      this.currentRoom = null
    }
  }

  /**
   * Stop local stream
   */
  stopLocalStream() {
    if (this.localStream) {
      this.localStream.getTracks().forEach(track => {
        track.stop()
        console.log('⏹️ Stopped track:', track.kind)
      })
      this.localStream = null
    }
  }

  /**
   * Toggle microphone
   */
  toggleMicrophone(enabled: boolean) {
    if (this.localStream) {
      this.localStream.getAudioTracks().forEach(track => {
        track.enabled = enabled
      })
      console.log(enabled ? '🎤 Microphone enabled' : '🎤 Microphone muted')
    }
  }

  /**
   * Toggle camera
   */
  toggleCamera(enabled: boolean) {
    if (this.localStream) {
      this.localStream.getVideoTracks().forEach(track => {
        track.enabled = enabled
      })
      console.log(enabled ? '📹 Camera enabled' : '📹 Camera disabled')
    }
  }

  /**
   * Get screen share stream
   */
  async getScreenShare(): Promise<MediaStream> {
    try {
      const stream = await navigator.mediaDevices.getDisplayMedia({
        video: true,
        audio: false
      })
      
      console.log('🖥️ Screen share started')
      return stream
    } catch (error: any) {
      console.error('❌ Screen share failed:', error)
      throw new Error('Screen sharing permission denied or not supported')
    }
  }

  /**
   * Replace video track (for screen sharing)
   */
  async replaceVideoTrack(newStream: MediaStream) {
    const videoTrack = newStream.getVideoTracks()[0]
    
    this.peers.forEach(({ peer }) => {
      try {
        // @ts-ignore - SimplePeer types don't include _pc
        const sender = peer._pc?.getSenders().find((s: RTCRtpSender) => 
          s.track?.kind === 'video'
        )
        if (sender) {
          sender.replaceTrack(videoTrack)
        }
      } catch (error) {
        console.error('Error replacing video track:', error)
      }
    })
  }

  /**
   * Emit custom event to signaling server
   */
  emit(eventName: string, data: any) {
    if (this.socket && this.socket.connected) {
      this.socket.emit(eventName, data)
      console.log(`📤 Emitted ${eventName}:`, data)
    } else {
      console.warn(`⚠️ Cannot emit ${eventName}: Socket not connected`)
    }
  }

  /**
   * Listen for custom events from signaling server
   */
  on(eventName: string, callback: (data: any) => void) {
    if (this.socket) {
      this.socket.on(eventName, callback)
      console.log(`👂 Listening for ${eventName}`)
    }
  }

  /**
   * Remove event listener
   */
  off(eventName: string, callback?: (data: any) => void) {
    if (this.socket) {
      if (callback) {
        this.socket.off(eventName, callback)
      } else {
        this.socket.off(eventName)
      }
    }
  }

  /**
   * Cleanup all connections
   */
  cleanup() {
    console.log('🧹 Cleaning up WebRTC service')
    
    this.leaveRoom()
    this.stopLocalStream()
    
    if (this.socket) {
      this.socket.disconnect()
      this.socket = null
    }
    
    this.peers.clear()
  }
}

// Export singleton instance
export const webrtcService = new WebRTCService()
