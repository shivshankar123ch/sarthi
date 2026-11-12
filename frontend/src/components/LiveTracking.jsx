/* eslint-disable react/prop-types */
import { useEffect, useRef, useState } from 'react'
import mapboxgl from 'mapbox-gl'
import 'mapbox-gl/dist/mapbox-gl.css'

const DEFAULT_CENTER = [ 77.209, 28.6139 ]

function isValidLocation(location) {
    return location &&
        Number.isFinite(location.latitude) &&
        Number.isFinite(location.longitude) &&
        Math.abs(location.latitude) <= 90 &&
        Math.abs(location.longitude) <= 180
}

function coordinates(location) {
    return [ location.longitude, location.latitude ]
}

const LiveTracking = ({
    driverLocation,
    nearbyCaptains = [],
    selectedCaptainId,
    onCaptainSelect
}) => {
    const mapContainerRef = useRef(null)
    const mapRef = useRef(null)
    const userMarkerRef = useRef(null)
    const driverMarkerRef = useRef(null)
    const captainMarkersRef = useRef(new Map())
    const [ currentPosition, setCurrentPosition ] = useState(null)
    const token = import.meta.env.VITE_MAPBOX_ACCESS_TOKEN

    useEffect(() => {
        if (!navigator.geolocation) {
            return undefined
        }

        const watchId = navigator.geolocation.watchPosition(
            position => setCurrentPosition({
                latitude: position.coords.latitude,
                longitude: position.coords.longitude
            }),
            error => console.error('Unable to read current location:', error.message),
            { enableHighAccuracy: true, maximumAge: 2000, timeout: 10000 }
        )

        return () => navigator.geolocation.clearWatch(watchId)
    }, [])

    useEffect(() => {
        if (!token || !mapContainerRef.current) {
            return undefined
        }

        mapboxgl.accessToken = token
        const map = new mapboxgl.Map({
            container: mapContainerRef.current,
            style: 'mapbox://styles/mapbox/streets-v12',
            center: DEFAULT_CENTER,
            zoom: 14
        })

        mapRef.current = map
        map.addControl(new mapboxgl.NavigationControl(), 'top-right')
        const captainMarkers = captainMarkersRef.current

        return () => {
            userMarkerRef.current?.remove()
            driverMarkerRef.current?.remove()
            captainMarkers.forEach(marker => marker.remove())
            captainMarkers.clear()
            map.remove()
            mapRef.current = null
            userMarkerRef.current = null
            driverMarkerRef.current = null
        }
    }, [ token ])

    useEffect(() => {
        const map = mapRef.current
        if (!map) {
            return
        }

        if (isValidLocation(currentPosition)) {
            if (!userMarkerRef.current) {
                userMarkerRef.current = new mapboxgl.Marker({ color: '#2563eb' }).addTo(map)
            }
            userMarkerRef.current.setLngLat(coordinates(currentPosition))
        }

        if (isValidLocation(driverLocation)) {
            if (!driverMarkerRef.current) {
                driverMarkerRef.current = new mapboxgl.Marker({ color: '#16a34a' }).addTo(map)
            }
            driverMarkerRef.current.setLngLat(coordinates(driverLocation))
        } else if (driverMarkerRef.current) {
            driverMarkerRef.current.remove()
            driverMarkerRef.current = null
        }

        const focusLocation = isValidLocation(driverLocation)
            ? driverLocation
            : nearbyCaptains.length
                ? null
                : currentPosition
        if (isValidLocation(focusLocation)) {
            map.easeTo({ center: coordinates(focusLocation), duration: 500 })
        }
    }, [ currentPosition, driverLocation, nearbyCaptains.length ])

    useEffect(() => {
        const map = mapRef.current
        if (!map) {
            return
        }

        const captains = nearbyCaptains.filter(captain =>
            isValidLocation({ latitude: captain.latitude, longitude: captain.longitude })
        );
        const visibleCaptainIds = new Set(captains.map(captain => captain._id))

        captainMarkersRef.current.forEach((marker, captainId) => {
            if (!visibleCaptainIds.has(captainId)) {
                marker.remove()
                captainMarkersRef.current.delete(captainId)
            }
        })

        const bounds = new mapboxgl.LngLatBounds()
        captains.forEach(captain => {
            let marker = captainMarkersRef.current.get(captain._id)
            if (!marker) {
                const element = document.createElement('button')
                element.type = 'button'
                element.setAttribute('aria-label', `Select ${captain.name || 'captain'}`)
                element.style.width = '22px'
                element.style.height = '22px'
                element.style.border = '3px solid white'
                element.style.borderRadius = '50%'
                element.style.boxShadow = '0 1px 5px rgba(0, 0, 0, 0.45)'
                element.addEventListener('click', () => onCaptainSelect?.(captain._id))
                marker = new mapboxgl.Marker({ element })
                    .setLngLat([ captain.longitude, captain.latitude ])
                    .addTo(map)
                captainMarkersRef.current.set(captain._id, marker)
            }

            marker.setLngLat([ captain.longitude, captain.latitude ])
            marker.getElement().style.backgroundColor = captain._id === selectedCaptainId
                ? '#2563eb'
                : '#f97316'
            bounds.extend([ captain.longitude, captain.latitude ])
        })

        if (captains.length) {
            map.fitBounds(bounds, {
                padding: { top: 50, bottom: window.innerHeight * 0.6, left: 50, right: 50 },
                maxZoom: 14,
                duration: 500
            })
        }
    }, [ nearbyCaptains, onCaptainSelect, selectedCaptainId ])

    if (!token) {
        return (
            <div className="flex h-full items-center justify-center bg-gray-100 p-4 text-center text-sm text-gray-600">
                Set VITE_MAPBOX_ACCESS_TOKEN in Frontend/.env to load the live map.
            </div>
        )
    }

    return <div ref={mapContainerRef} className="h-full w-full" aria-label="Live driver map" />
}

export default LiveTracking
