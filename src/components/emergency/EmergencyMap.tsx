/**
 * Emergency Map Component for "Bachao Bachao" Feature
 * Shows current location and nearest facilities with markers
 * Simplified version to avoid React Leaflet compatibility issues
 */

import { useEffect, useRef } from 'react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

// Fix for default marker icons in Leaflet
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png'
import markerIcon from 'leaflet/dist/images/marker-icon.png'
import markerShadow from 'leaflet/dist/images/marker-shadow.png'

delete (L.Icon.Default.prototype as any)._getIconUrl
L.Icon.Default.mergeOptions({
  iconUrl: markerIcon,
  iconRetinaUrl: markerIcon2x,
  shadowUrl: markerShadow,
})

interface EmergencyMapProps {
  patientLocation: { lat: number; lng: number }
  facilities: Array<{
    id: string
    name: string
    type: string
    address: string
    phone: string
    location: { lat: number; lng: number }
    distance?: number
    eta?: string
    bedsAvailable?: number
  }>
  accuracy?: number
  selectedFacilityId?: string
  onFacilitySelect?: (facility: any) => void
  showRoute?: boolean
  className?: string
}

export function EmergencyMap({
  patientLocation,
  facilities,
  accuracy = 50,
  className = '',
}: EmergencyMapProps) {
  const mapRef = useRef<HTMLDivElement>(null)
  const leafletMapRef = useRef<L.Map | null>(null)

  useEffect(() => {
    if (!mapRef.current) return

    // Initialize map
    const map = L.map(mapRef.current, {
      center: [patientLocation.lat, patientLocation.lng],
      zoom: 12,
      zoomControl: true,
    })

    leafletMapRef.current = map

    // Add tile layer
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      maxZoom: 19,
    }).addTo(map)

    // Create custom patient icon
    const patientIcon = L.divIcon({
      className: 'custom-patient-marker',
      html: `
        <div style="position: relative;">
          <div style="
            width: 30px;
            height: 30px;
            background-color: #EF4444;
            border: 4px solid white;
            border-radius: 50%;
            box-shadow: 0 2px 8px rgba(0,0,0,0.3);
            animation: pulse 2s infinite;
          "></div>
        </div>
      `,
      iconSize: [30, 30],
      iconAnchor: [15, 15],
    })

    // Add patient marker
    const patientMarker = L.marker([patientLocation.lat, patientLocation.lng], {
      icon: patientIcon,
    }).addTo(map)

    patientMarker.bindPopup(`
      <div style="padding: 8px;">
        <strong>📍 Your Current Location</strong><br/>
        <span style="font-size: 12px; color: #666;">
          ${patientLocation.lat.toFixed(6)}, ${patientLocation.lng.toFixed(6)}
        </span><br/>
        <span style="font-size: 11px; color: #888;">
          Accuracy: ±${Math.round(accuracy)}m
        </span>
      </div>
    `)

    // Add accuracy circle
    L.circle([patientLocation.lat, patientLocation.lng], {
      radius: accuracy,
      color: '#EF4444',
      fillColor: '#EF4444',
      fillOpacity: 0.1,
      weight: 2,
    }).addTo(map)

    // Add facility markers
    facilities.forEach((facility) => {
      const facilityColor = facility.type === 'dh' ? '#EF4444' : facility.type === 'chc' ? '#F59E0B' : '#3B82F6'
      
      const facilityIcon = L.divIcon({
        className: 'custom-facility-marker',
        html: `
          <div style="
            width: 12px;
            height: 12px;
            background-color: ${facilityColor};
            border: 3px solid white;
            border-radius: 50%;
            box-shadow: 0 2px 6px rgba(0,0,0,0.3);
          "></div>
        `,
        iconSize: [18, 18],
        iconAnchor: [9, 9],
      })

      const marker = L.marker([facility.location.lat, facility.location.lng], {
        icon: facilityIcon,
      }).addTo(map)

      marker.bindPopup(`
        <div style="padding: 12px; min-width: 200px;">
          <div style="margin-bottom: 8px;">
            <strong style="font-size: 14px;">🏥 ${facility.name}</strong><br/>
            <span style="font-size: 11px; color: #666;">${facility.type === 'dh' ? 'District Hospital' : facility.type === 'chc' ? 'Community Health Center' : 'Primary Health Center'}</span>
          </div>
          <div style="font-size: 12px; margin-top: 8px;">
            <div style="margin: 4px 0;">
              📍 <strong>${facility.distance?.toFixed(2) || '?'} km</strong> away
            </div>
            <div style="margin: 4px 0;">
              🛏️ <strong>${facility.bedsAvailable || 0}</strong> beds available
            </div>
            <div style="margin: 4px 0;">
              ⏱️ ETA: <strong>${facility.eta || 'Calculating...'}</strong>
            </div>
            <div style="margin: 4px 0;">
              📞 <a href="tel:${facility.phone}" style="color: #3B82F6;">${facility.phone}</a>
            </div>
          </div>
          <div style="margin-top: 12px; padding-top: 8px; border-top: 1px solid #E5E7EB;">
            <a 
              href="https://www.google.com/maps/dir/?api=1&origin=${patientLocation.lat},${patientLocation.lng}&destination=${facility.location.lat},${facility.location.lng}"
              target="_blank"
              rel="noopener noreferrer"
              style="color: #3B82F6; font-size: 11px; text-decoration: none;"
            >
              Get Directions →
            </a>
          </div>
        </div>
      `)
    })

    // Cleanup
    return () => {
      map.remove()
      leafletMapRef.current = null
    }
  }, [patientLocation, facilities, accuracy])

  return (
    <>
      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.7; transform: scale(1.1); }
        }
        .custom-patient-marker, .custom-facility-marker {
          background: transparent;
          border: none;
        }
        .leaflet-popup-content-wrapper {
          border-radius: 12px;
          box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        }
        .leaflet-popup-content {
          margin: 0;
        }
      `}</style>
      <div 
        ref={mapRef} 
        className={className}
        style={{ height: '100%', width: '100%', borderRadius: '12px' }}
      />
    </>
  )
}

export default EmergencyMap
