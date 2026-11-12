/* eslint-disable react/prop-types */

import { useEffect, useState } from 'react'
import axios from 'axios'

const ConfirmRide = (props) => {
    const {
        isOpen,
        pickup,
        onNearbyCaptainsChange,
        setSelectedCaptainId
    } = props
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [errorMessage, setErrorMessage] = useState('')
    const [nearbyCaptains, setNearbyCaptains] = useState([])
    const [isLoadingCaptains, setIsLoadingCaptains] = useState(false)
    const [captainListError, setCaptainListError] = useState('')

    useEffect(() => {
        if (!isOpen || !pickup.trim()) {
            setNearbyCaptains([])
            onNearbyCaptainsChange([])
            setSelectedCaptainId(null)
            setIsLoadingCaptains(false)
            setCaptainListError('')
            return
        }

        const controller = new AbortController()
        setNearbyCaptains([])
        onNearbyCaptainsChange([])
        setSelectedCaptainId(null)
        setIsLoadingCaptains(true)
        setCaptainListError('')

        axios.get(`${import.meta.env.VITE_BASE_URL}/maps/get-nearby-captains`, {
            params: { address: pickup },
            headers: {
                Authorization: `Bearer ${localStorage.getItem('token')}`
            },
            signal: controller.signal
        }).then(response => {
            if (!Array.isArray(response.data.captains)) {
                throw new Error('Nearby captains response was invalid.')
            }
            setNearbyCaptains(response.data.captains)
            onNearbyCaptainsChange(response.data.captains)
        }).catch(error => {
            if (controller.signal.aborted) return
            onNearbyCaptainsChange([])
            setCaptainListError(
                error.response?.data?.message || error.message || 'Unable to load nearby captains.'
            )
        }).finally(() => {
            if (!controller.signal.aborted) {
                setIsLoadingCaptains(false)
            }
        })

        return () => controller.abort()
    }, [ isOpen, onNearbyCaptainsChange, pickup, setSelectedCaptainId ])

    const confirmRide = async () => {
        if (!props.selectedCaptainId) {
            setErrorMessage('Select a live captain on the map or from the list first.')
            return
        }

        setIsSubmitting(true)
        setErrorMessage('')
        props.setRide(null)
        props.setVehicleFound(true)
        props.setConfirmRidePanel(false)

        try {
            const response = await props.createRide()
            props.setRide(currentRide => currentRide
                ? { ...response.data, ...currentRide, otp: currentRide.otp || response.data.otp }
                : response.data)
        } catch (error) {
            setErrorMessage(error.response?.data?.message || 'Ride could not be confirmed. Please try again.')
            props.setVehicleFound(false)
            props.setConfirmRidePanel(true)
        } finally {
            setIsSubmitting(false)
        }
    }

    return (
        <div>
            <h5 className='p-1 text-center w-[93%] absolute top-0' onClick={() => {
                props.setConfirmRidePanel(false)
            }}><i className="text-3xl text-gray-200 ri-arrow-down-wide-line"></i></h5>
            <h3 className='text-2xl font-semibold mb-5'>Confirm your Ride</h3>

            <section className='mb-4 rounded-lg border border-gray-200 p-4' aria-live='polite'>
                <h4 className='font-semibold'>Nearby captains</h4>
                <p className='mb-2 text-sm text-gray-600'>Tap a live map marker or select a captain below.</p>
                {isLoadingCaptains && <p className='text-sm text-gray-600'>Finding nearby captains...</p>}
                {captainListError && <p role='alert' className='text-sm text-red-600'>{captainListError}</p>}
                {!isLoadingCaptains && !captainListError && nearbyCaptains.length === 0 && (
                    <p className='text-sm text-gray-600'>No captains nearby right now.</p>
                )}
                {nearbyCaptains.length > 0 && (
                    <ul className='divide-y divide-gray-200'>
                        {nearbyCaptains.map(captain => (
                            <li key={captain._id}>
                                <button
                                    type='button'
                                    aria-pressed={props.selectedCaptainId === captain._id}
                                    onClick={() => props.setSelectedCaptainId(captain._id)}
                                    className={`flex w-full items-center justify-between gap-3 py-2 text-left ${
                                        props.selectedCaptainId === captain._id
                                            ? 'bg-blue-50'
                                            : 'bg-white'
                                    }`}
                                >
                                    <div>
                                        <p className='font-medium'>{captain.name || 'Captain'}</p>
                                        <p className='text-sm capitalize text-gray-600'>
                                            {captain.vehicleType.replaceAll('-', ' ')}
                                        </p>
                                    </div>
                                    <span className='whitespace-nowrap text-sm text-gray-600'>
                                        {captain.distanceKm < 1
                                            ? `${Math.round(captain.distanceKm * 1000)} m away`
                                            : `${captain.distanceKm.toFixed(1)} km away`}
                                    </span>
                                </button>
                            </li>
                        ))}
                    </ul>
                )}
            </section>

            <div className='flex gap-2 justify-between flex-col items-center'>
                <img className='h-20' src="https://swyft.pl/wp-content/uploads/2023/05/how-many-people-can-a-uberx-take.jpg" alt="" />
                <div className='w-full mt-5'>
                    <div className='flex items-center gap-5 p-3 border-b-2'>
                        <i className="ri-map-pin-user-fill"></i>
                        <div>
                            <h3 className='text-lg font-medium'>562/11-A</h3>
                            <p className='text-sm -mt-1 text-gray-600'>{props.pickup}</p>
                        </div>
                    </div>
                    <div className='flex items-center gap-5 p-3 border-b-2'>
                        <i className="text-lg ri-map-pin-2-fill"></i>
                        <div>
                            <h3 className='text-lg font-medium'>562/11-A</h3>
                            <p className='text-sm -mt-1 text-gray-600'>{props.destination}</p>
                        </div>
                    </div>
                    <div className='flex items-center gap-5 p-3'>
                        <i className="ri-currency-line"></i>
                        <div>
                            <h3 className='text-lg font-medium'>₹{props.fare[ props.vehicleType ]}</h3>
                            <p className='text-sm -mt-1 text-gray-600'>Cash Cash</p>
                        </div>
                    </div>
                </div>
                {errorMessage && <p role="alert" className="w-full text-sm text-red-600">{errorMessage}</p>}
                <button
                    type="button"
                    onClick={confirmRide}
                    disabled={isSubmitting}
                    className='sticky bottom-0 z-10 min-h-12 w-full mt-5 border-2 border-green-800 bg-green-700 text-lg text-white font-bold p-3 rounded-lg shadow-lg hover:bg-green-800 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-green-300 disabled:cursor-not-allowed disabled:opacity-70'
                >
                    {isSubmitting ? 'Sending request...' : 'Request selected captain'}
                </button>
            </div>
        </div>
    )
}

export default ConfirmRide