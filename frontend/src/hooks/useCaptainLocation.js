import { useContext, useEffect } from 'react'
import { SocketContext } from '../context/SocketContext'
import { CaptainDataContext } from '../context/CapatainContext'

const LOCATION_UPDATE_INTERVAL_MS = 2000
const LOCATION_HEARTBEAT_INTERVAL_MS = 10000

export default function useCaptainLocation() {
    const { socket } = useContext(SocketContext)
    const { captain } = useContext(CaptainDataContext)

    useEffect(() => {
        if (!captain?._id || !navigator.geolocation) {
            return undefined
        }

        socket.emit('join', {
            userId: captain._id,
            userType: 'captain'
        })

        let lastUpdateAt = 0
        const publishLocation = position => {
            const now = Date.now()
            if (now - lastUpdateAt < LOCATION_UPDATE_INTERVAL_MS) {
                return
            }
            lastUpdateAt = now

            socket.emit('update-location-captain', {
                userId: captain._id,
                location: {
                    ltd: position.coords.latitude,
                    lng: position.coords.longitude
                }
            })
        }
        const reportLocationError = error => {
            console.error('Unable to publish captain location:', error.message)
        }
        const locationOptions = { enableHighAccuracy: true, maximumAge: 1000, timeout: 15000 }
        const watchId = navigator.geolocation.watchPosition(
            publishLocation,
            reportLocationError,
            locationOptions
        )
        const heartbeatId = setInterval(() => {
            navigator.geolocation.getCurrentPosition(
                publishLocation,
                reportLocationError,
                locationOptions
            )
        }, LOCATION_HEARTBEAT_INTERVAL_MS)
        navigator.geolocation.getCurrentPosition(publishLocation, reportLocationError, locationOptions)

        return () => {
            navigator.geolocation.clearWatch(watchId)
            clearInterval(heartbeatId)
        }
    }, [ captain?._id, socket ])
}
