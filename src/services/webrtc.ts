/**
 * WebRTC Service for Real-Time Video Calling
 * Handles camera access, peer connections, and signaling
 */

import SimplePeer from 'simple-peer'

interface WebRTCConfig {
  iceServers: RTCIceServer[]
}

interface PeerConnection {
  peer: SimplePeer.Instance
  stream?: MediaStream
  userId: string
}

interface SignalData {
  type: 'signal'
  signal: SimplePeer.SignalData
  from: string
  room: string
}

export interface ConnectionQuality {
  bandwidth: number // kbps
  packetLoss: number // percentage
  latency: number // ms
  quality: 'excellent' | 'good' | 'fair' | 'poor' | 'critical'
}

// STUN servers for NAT traversal (free Google STUN servers)
const DEFAULT_CONFIG: WebRTCConfig = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
    { urls: 'stun:stun2.l.google.com:19302' },
  ]
}

export class WebRTCService {
  private ws: WebSocket | null = null
  private localStream: MediaStream | null = null
  private peers: Map<string, PeerConnection> = new Map()
  private currentRoom: string | null = null
  private userId: string | null = null
  private config: WebRTCConfig
  
  // Event handlers
  public onRemoteStream?: (userId: string, stream: MediaStream) => void
  public onPeerConnected?: (userId: string) => void
  public onPeerDisconnected?: (userId: string) => void
  public onConnectionQualityChange?: (quality: ConnectionQuality) => void
  public onError?: (error: Error) => void

  constructor(config?: Partial<WebRTCConfig>) {
    this.config = { ...DEFAULT_CONFIG, ...config }
  }

  /**
   * Initialize WebSocket connection for signaling
   */
  async connect(wsUrl: string, token: string, userId: string): Promise<void> {
    return new Promise((resolve, reject) => {
      this.userId = userId
      this.ws = new WebSocket(wsUrl)

      this.ws.onopen = () => {
        // Authenticate WebSocket connection
        this.send({ type: 'auth', token })
        resolve()
      }

      this.ws.onerror = (error) => {
        console.error('WebSocket error:', error)
        reject(new Error('WebSocket connection failed'))
      }

      this.ws.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data)
          this.handleSignalingMessage(message)
        } catch (error) {
          console.error('Failed to parse WebSocket message:', error)
        }
      }

      this.ws.onclose = () => {
        console.log('WebSocket connection closed')
        this.cleanup()
      }
    })
  }

  /**
   * Get user media (camera + microphone)
   */
  async getLocalStream(constraints?: MediaStreamConstraints): Promise<MediaStream> {
    try {
      const defaultConstraints: MediaStreamConstraints = {
        video: {
          width: { ideal: 1280, max: 1920 },
          height: { ideal: 720, max: 1080 },
          frameRate: { ideal: 30, max: 30 }
        },
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        }
      }

      this.localStream = await navigator.mediaDevices.getUserMedia(
        constraints || defaultConstraints
      )

      return this.localStream
    } catch (error) {
      console.error('Failed to get user media:', error)
      throw new Error('Camera/microphone access denied or unavailable')
    }
  }

  /**
   * Get screen share stream
   */
  async getScreenShare(): Promise<MediaStream> {
    try {
      const screenStream = await navigator.mediaDevices.getDisplayMedia({
        video: true,
        audio: false
      })

      return screenStream
    } catch (error) {
      console.error('Failed to get screen share:', error)
      throw new Error('Screen share permission denied')
    }
  }

  /**
   * Join a video call room
   */
  async joinRoom(roomId: string, initiator: boolean = false): Promise<void> {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      throw new Error('WebSocket not connected')
    }

    if (!this.localStream) {
      throw new Error('Local stream not initialized. Call getLocalStream() first.')
    }

    this.currentRoom = roomId

    // Join the room via WebSocket
    this.send({ type: 'room:join', room: roomId })

    // If initiator, create peer and send offer
    if (initiator) {
      // Wait a bit for other peers to join
      await new Promise(resolve => setTimeout(resolve, 1000))
    }
  }

  /**
   * Create a peer connection
   */
  createPeer(targetUserId: string, initiator: boolean): SimplePeer.Instance {
    const peer = new SimplePeer({
      initiator,
      stream: this.localStream || undefined,
      config: this.config,
      trickle: true // Send ICE candidates as they're generated
    })

    // Handle signaling data (SDP offer/answer, ICE candidates)
    peer.on('signal', (signal) => {
      this.send({
        type: 'signal',
        room: this.currentRoom!,
        targetUserId,
        signal
      })
    })

    // Handle incoming stream
    peer.on('stream', (remoteStream) => {
      console.log('Received remote stream from', targetUserId)
      const peerConnection = this.peers.get(targetUserId)
      if (peerConnection) {
        peerConnection.stream = remoteStream
      }
      this.onRemoteStream?.(targetUserId, remoteStream)
    })

    // Handle connection established
    peer.on('connect', () => {
      console.log('Peer connection established with', targetUserId)
      this.onPeerConnected?.(targetUserId)
      this.startQualityMonitoring(targetUserId)
    })

    // Handle errors
    peer.on('error', (error) => {
      console.error('Peer error:', error)
      this.onError?.(error)
    })

    // Handle connection close
    peer.on('close', () => {
      console.log('Peer connection closed with', targetUserId)
      this.peers.delete(targetUserId)
      this.onPeerDisconnected?.(targetUserId)
    })

    // Store peer connection
    this.peers.set(targetUserId, { peer, userId: targetUserId })

    return peer
  }

  /**
   * Handle incoming signaling messages
   */
  private handleSignalingMessage(message: any): void {
    switch (message.type) {
      case 'auth:ok':
        console.log('WebSocket authenticated')
        break

      case 'room:joined':
        console.log('Joined room:', message.room)
        break

      case 'signal':
        this.handleSignalData(message)
        break

      case 'peer:joined':
        // Another user joined the room - initiate connection
        if (message.userId !== this.userId) {
          console.log('Peer joined, creating connection as initiator')
          this.createPeer(message.userId, true)
        }
        break

      case 'peer:left':
        // User left the room
        const peer = this.peers.get(message.userId)
        if (peer) {
          peer.peer.destroy()
          this.peers.delete(message.userId)
          this.onPeerDisconnected?.(message.userId)
        }
        break

      default:
        console.log('Unknown signaling message:', message.type)
    }
  }

  /**
   * Handle WebRTC signal data (SDP offer/answer, ICE candidates)
   */
  private handleSignalData(message: SignalData): void {
    const { from, signal } = message

    // Ignore signals from self
    if (from === this.userId) return

    let peerConnection = this.peers.get(from)

    if (!peerConnection) {
      // Create peer as responder (not initiator)
      console.log('Creating peer connection as responder for', from)
      this.createPeer(from, false)
      peerConnection = this.peers.get(from)
    }

    if (peerConnection) {
      try {
        peerConnection.peer.signal(signal)
      } catch (error) {
        console.error('Error signaling peer:', error)
      }
    }
  }

  /**
   * Monitor connection quality
   */
  private async startQualityMonitoring(userId: string): Promise<void> {
    const peerConnection = this.peers.get(userId)
    if (!peerConnection) return

    const peer = peerConnection.peer
    
    // Monitor every 2 seconds
    const monitorInterval = setInterval(async () => {
      if (!peer || peer.destroyed) {
        clearInterval(monitorInterval)
        return
      }

      try {
        // @ts-ignore - Access underlying RTCPeerConnection
        const pc = peer._pc as RTCPeerConnection
        if (!pc) return

        const stats = await pc.getStats()
        let bytesReceived = 0
        let packetsLost = 0
        let packetsReceived = 0
        let currentRoundTripTime = 0

        stats.forEach((report) => {
          if (report.type === 'inbound-rtp' && report.mediaType === 'video') {
            bytesReceived = report.bytesReceived || 0
            packetsLost = report.packetsLost || 0
            packetsReceived = report.packetsReceived || 0
          }
          if (report.type === 'candidate-pair' && report.state === 'succeeded') {
            currentRoundTripTime = report.currentRoundTripTime || 0
          }
        })

        // Calculate metrics
        const bandwidth = Math.round((bytesReceived * 8) / 1000) // kbps
        const packetLoss = packetsReceived > 0 
          ? Math.round((packetsLost / (packetsLost + packetsReceived)) * 100) 
          : 0
        const latency = Math.round(currentRoundTripTime * 1000) // ms

        // Determine quality
        let quality: ConnectionQuality['quality'] = 'excellent'
        if (bandwidth < 200 || packetLoss > 10 || latency > 300) {
          quality = 'critical'
        } else if (bandwidth < 500 || packetLoss > 5 || latency > 200) {
          quality = 'poor'
        } else if (bandwidth < 1000 || packetLoss > 2 || latency > 150) {
          quality = 'fair'
        } else if (bandwidth < 2000 || latency > 100) {
          quality = 'good'
        }

        const connectionQuality: ConnectionQuality = {
          bandwidth,
          packetLoss,
          latency,
          quality
        }

        this.onConnectionQualityChange?.(connectionQuality)

      } catch (error) {
        console.error('Error monitoring connection quality:', error)
      }
    }, 2000)
  }

  /**
   * Toggle microphone
   */
  toggleMicrophone(enabled: boolean): void {
    if (this.localStream) {
      this.localStream.getAudioTracks().forEach(track => {
        track.enabled = enabled
      })
    }
  }

  /**
   * Toggle camera
   */
  toggleCamera(enabled: boolean): void {
    if (this.localStream) {
      this.localStream.getVideoTracks().forEach(track => {
        track.enabled = enabled
      })
    }
  }

  /**
   * Replace video track (for screen sharing)
   */
  async replaceVideoTrack(newStream: MediaStream): Promise<void> {
    const videoTrack = newStream.getVideoTracks()[0]
    
    if (!videoTrack) {
      throw new Error('No video track in new stream')
    }

    // Replace track in all peer connections
    for (const [userId, peerConnection] of this.peers) {
      try {
        // @ts-ignore - Access underlying RTCPeerConnection
        const pc = peerConnection.peer._pc as RTCPeerConnection
        const senders = pc.getSenders()
        const videoSender = senders.find(sender => 
          sender.track && sender.track.kind === 'video'
        )

        if (videoSender) {
          await videoSender.replaceTrack(videoTrack)
          console.log('Replaced video track for', userId)
        }
      } catch (error) {
        console.error('Error replacing video track:', error)
      }
    }
  }

  /**
   * Leave current room
   */
  leaveRoom(): void {
    if (this.currentRoom) {
      this.send({ type: 'room:leave', room: this.currentRoom })
      this.currentRoom = null
    }

    // Destroy all peer connections
    this.peers.forEach(({ peer }) => {
      peer.destroy()
    })
    this.peers.clear()
  }

  /**
   * Stop local media tracks
   */
  stopLocalStream(): void {
    if (this.localStream) {
      this.localStream.getTracks().forEach(track => track.stop())
      this.localStream = null
    }
  }

  /**
   * Send message via WebSocket
   */
  private send(message: any): void {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(message))
    } else {
      console.error('WebSocket not connected, cannot send message')
    }
  }

  /**
   * Get current local stream
   */
  getCurrentLocalStream(): MediaStream | null {
    return this.localStream
  }

  /**
   * Get remote stream for a specific user
   */
  getRemoteStream(userId: string): MediaStream | null {
    return this.peers.get(userId)?.stream || null
  }

  /**
   * Get all peer user IDs
   */
  getPeerIds(): string[] {
    return Array.from(this.peers.keys())
  }

  /**
   * Cleanup resources
   */
  cleanup(): void {
    this.leaveRoom()
    this.stopLocalStream()
    
    if (this.ws) {
      this.ws.close()
      this.ws = null
    }
  }

  /**
   * Check if browser supports WebRTC
   */
  static isSupported(): boolean {
    return !!(
      navigator.mediaDevices &&
      navigator.mediaDevices.getUserMedia &&
      window.RTCPeerConnection
    )
  }

  /**
   * Check camera/microphone permissions
   */
  static async checkPermissions(): Promise<{ camera: boolean; microphone: boolean }> {
    try {
      const permissions = {
        camera: false,
        microphone: false
      }

      // Check camera permission
      try {
        const cameraPermission = await navigator.permissions.query({ name: 'camera' as PermissionName })
        permissions.camera = cameraPermission.state === 'granted'
      } catch (e) {
        // Permission API not supported, try getUserMedia
        try {
          const stream = await navigator.mediaDevices.getUserMedia({ video: true })
          stream.getTracks().forEach(track => track.stop())
          permissions.camera = true
        } catch (e) {
          permissions.camera = false
        }
      }

      // Check microphone permission
      try {
        const micPermission = await navigator.permissions.query({ name: 'microphone' as PermissionName })
        permissions.microphone = micPermission.state === 'granted'
      } catch (e) {
        // Permission API not supported, try getUserMedia
        try {
          const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
          stream.getTracks().forEach(track => track.stop())
          permissions.microphone = true
        } catch (e) {
          permissions.microphone = false
        }
      }

      return permissions
    } catch (error) {
      console.error('Error checking permissions:', error)
      return { camera: false, microphone: false }
    }
  }
}

// Export singleton instance
export const webrtcService = new WebRTCService()
