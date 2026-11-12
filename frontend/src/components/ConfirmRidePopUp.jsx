/* eslint-disable react/prop-types */

import { useEffect, useState } from 'react'
import axios from 'axios'
import { useNavigate } from 'react-router-dom'

const ConfirmRidePopUp = (props) => {
    const [ otp, setOtp ] = useState('')
    const [ vehiclePlateImage, setVehiclePlateImage ] = useState(null)
    const [ showConfirmation, setShowConfirmation ] = useState(false)
    const [ isStartingRide, setIsStartingRide ] = useState(false)
    const [ errorMessage, setErrorMessage ] = useState('')
    const [ plateImagePreview, setPlateImagePreview ] = useState('')
    const navigate = useNavigate()

    useEffect(() => {
        if (!vehiclePlateImage) {
            setPlateImagePreview('')
            return undefined
        }

        const previewUrl = URL.createObjectURL(vehiclePlateImage)
        setPlateImagePreview(previewUrl)
        return () => URL.revokeObjectURL(previewUrl)
    }, [ vehiclePlateImage ])

    const submitHander = (e) => {
        e.preventDefault()
        setErrorMessage('')
        setShowConfirmation(true)
    }

    const confirmStartRide = async () => {
        setIsStartingRide(true)
        const rideData = new FormData()
        rideData.append('rideId', props.ride._id)
        rideData.append('otp', otp)
        rideData.append('vehiclePlateImage', vehiclePlateImage)
        try {
            const response = await axios.post(`${import.meta.env.VITE_BASE_URL}/rides/start-ride`, rideData, {
            headers: {
                Authorization: `Bearer ${localStorage.getItem('token')}`
            }
        })

            if (response.status === 200) {
                props.setConfirmRidePopupPanel(false)
                props.setRidePopupPanel(false)
                navigate('/captain-riding', { state: { ride: response.data } })
            }
        } catch (error) {
            setErrorMessage(error.response?.data?.message || 'Ride could not be started. Please check the OTP and try again.')
            setShowConfirmation(false)
        } finally {
            setIsStartingRide(false)
        }
    }
    return (
        <div>
            <h5 className='p-1 text-center w-[93%] absolute top-0' onClick={() => {
                props.setRidePopupPanel(false)
            }}><i className="text-3xl text-gray-200 ri-arrow-down-wide-line"></i></h5>
            <h3 className='text-2xl font-semibold mb-5'>Enter the owner&apos;s OTP to start</h3>
            <div className='flex items-center justify-between p-3 border-2 border-yellow-400 rounded-lg mt-4'>
                <div className='flex items-center gap-3 '>
                    <img className='h-12 rounded-full object-cover w-12' src="https://i.pinimg.com/236x/af/26/28/af26280b0ca305be47df0b799ed1b12b.jpg" alt="" />
                    <h2 className='text-lg font-medium capitalize'>{props.ride?.user.fullname.firstname}</h2>
                </div>
                <h5 className='text-lg font-semibold'>2.2 KM</h5>
            </div>
            <div className='flex gap-2 justify-between flex-col items-center'>
                <div className='w-full mt-5'>
                    <div className='flex items-center gap-5 p-3 border-b-2'>
                        <i className="ri-map-pin-user-fill"></i>
                        <div>
                            <h3 className='text-lg font-medium'>562/11-A</h3>
                            <p className='text-sm -mt-1 text-gray-600'>{props.ride?.pickup}</p>
                        </div>
                    </div>
                    <div className='flex items-center gap-5 p-3 border-b-2'>
                        <i className="text-lg ri-map-pin-2-fill"></i>
                        <div>
                            <h3 className='text-lg font-medium'>562/11-A</h3>
                            <p className='text-sm -mt-1 text-gray-600'>{props.ride?.destination}</p>
                        </div>
                    </div>
                    <div className='flex items-center gap-5 p-3'>
                        <i className="ri-currency-line"></i>
                        <div>
                            <h3 className='text-lg font-medium'>₹{props.ride?.fare} </h3>
                            <p className='text-sm -mt-1 text-gray-600'>Cash Cash</p>
                        </div>
                    </div>
                </div>

                <div className='mt-6 w-full'>
                    <form onSubmit={submitHander}>
                        <label htmlFor="ride-otp" className="block text-sm font-medium">Ask the owner for the 4-digit OTP and enter it here</label>
                        <input
                            id="ride-otp"
                            value={otp}
                            onChange={(event) => setOtp(event.target.value.replace(/\D/g, '').slice(0, 4))}
                            type="text"
                            inputMode="numeric"
                            pattern="[0-9]{4}"
                            maxLength={4}
                            required
                            className='bg-[#eee] px-6 py-4 font-mono text-lg rounded-lg w-full mt-3'
                            placeholder='4-digit OTP'
                        />
                        <label htmlFor="vehicle-plate-image" className="mt-4 block text-sm font-medium">
                            Upload a clear vehicle number-plate image
                        </label>
                        <input
                            id="vehicle-plate-image"
                            type="file"
                            accept="image/jpeg,image/png,image/webp"
                            required
                            className="mt-2 block w-full rounded-lg border bg-[#eee] px-3 py-3 text-sm"
                            onChange={(event) => setVehiclePlateImage(event.target.files?.[0] || null)}
                        />
                        <p className="mt-1 text-xs text-gray-500">JPEG, PNG, or WebP; maximum 5 MB.</p>
                        {errorMessage && <p role="alert" className="mt-3 text-sm text-red-600">{errorMessage}</p>}

                        <button type="submit" className='w-full mt-5 text-lg flex justify-center bg-green-600 text-white font-semibold p-3 rounded-lg'>Continue</button>
                        <button type="button" onClick={() => {
                            props.setConfirmRidePopupPanel(false)
                            props.setRidePopupPanel(false)
                        }} className='w-full mt-2 bg-red-600 text-lg text-white font-semibold p-3 rounded-lg'>Cancel</button>
                    </form>
                </div>
            </div>
            {showConfirmation && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 p-4">
                    <section
                        className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl"
                        role="dialog"
                        aria-modal="true"
                        aria-labelledby="confirm-ride-start-title"
                    >
                        <h3 id="confirm-ride-start-title" className="text-xl font-semibold">Confirm ride start</h3>
                        <p className="mt-2 text-sm text-gray-600">
                            Confirm the user&apos;s OTP and check that the vehicle plate image is clear.
                        </p>
                        {plateImagePreview && (
                            <img
                                src={plateImagePreview}
                                alt="Uploaded vehicle number plate"
                                className="mt-4 max-h-40 w-full rounded-lg border object-contain"
                            />
                        )}
                        <div className="mt-5 flex gap-3">
                            <button
                                type="button"
                                disabled={isStartingRide}
                                onClick={() => setShowConfirmation(false)}
                                className="w-1/2 rounded-lg bg-gray-200 px-4 py-3 font-semibold text-gray-800 disabled:opacity-50"
                            >
                                Go back
                            </button>
                            <button
                                type="button"
                                disabled={isStartingRide}
                                onClick={confirmStartRide}
                                className="w-1/2 rounded-lg bg-green-600 px-4 py-3 font-semibold text-white disabled:opacity-50"
                            >
                                {isStartingRide ? 'Starting...' : 'Confirm'}
                            </button>
                        </div>
                    </section>
                </div>
            )}
        </div>
    )
}

export default ConfirmRidePopUp